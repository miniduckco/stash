import { randomUUID } from "node:crypto";
import {
  buildFormEncoded,
  parseFormBody,
  parseFormEncoded,
  pairsToRecord,
} from "./internal/form.js";
import { formatAmount } from "./internal/guards.js";
import { StashError } from "./errors.js";
import type {
  ParsedWebhook,
  Payment,
  PaymentCreateInput,
  PaymentProvider,
  PaymentVerifyInput,
  PaymentRequest,
  PaymentResponse,
  StashConfig,
  VerificationResult,
  WebhookEvent,
  WebhookParseInput,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";
import { providerAdapters } from "./providers/adapters.js";
import { makeOzowPayment, verifyOzowWebhook } from "./providers/ozow.js";
import { makePayfastPayment, verifyPayfastWebhook } from "./providers/payfast.js";
import { makePaystackPayment, verifyPaystackWebhook } from "./providers/paystack.js";

export type {
  OzowProviderOptions,
  ParsedWebhook,
  LogEvent,
  Logger,
  Payment,
  PaymentCreateInput,
  PaymentProvider,
  PaymentVerifyInput,
  PaymentRequest,
  PaymentResponse,
  PaystackProviderOptions,
  PayfastProviderOptions,
  ProviderOptions,
  StashConfig,
  VerificationResult,
  WebhookEvent,
  WebhookParseInput,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";

export { StashError } from "./errors.js";

export { buildFormEncoded, parseFormBody, parseFormEncoded, pairsToRecord } from "./internal/form.js";

export function createStash(config: StashConfig) {
  const provider = config.provider;
  const testMode = config.testMode ?? false;

  return {
    payments: {
      create: async (input: PaymentCreateInput): Promise<Payment> => {
        const currency = input.currency ?? config.defaults?.currency ?? "ZAR";
        const amountNumber = Number(formatAmount(input.amount));

        const paymentRequest: PaymentRequest = {
          provider,
          amount: input.amount,
          currency,
          reference: input.reference,
          description: input.description,
          customer: input.customer,
          urls: input.urls,
          metadata: input.metadata,
          providerOptions: input.providerOptions,
          providerData: input.providerData,
          testMode,
          secrets: buildSecrets(provider, config.credentials),
        };

        const adapter = providerAdapters[provider];
        const response = await adapter.createPayment(paymentRequest);

        return {
          id: randomUUID(),
          status: "pending",
          amount: amountNumber,
          currency,
          redirectUrl: response.redirectUrl,
          provider,
          providerRef: response.paymentRequestId,
          raw: response.raw ?? response,
        };
      },
      verify: async (input: PaymentVerifyInput): Promise<VerificationResult> => {
        const adapter = providerAdapters[provider];
        if (!adapter?.verifyPayment) {
          throw new StashError(
            "unsupported_capability",
            `payments.verify is not supported for ${provider}`
          );
        }

        return adapter.verifyPayment({
          reference: input.reference,
          secrets: buildSecrets(provider, config.credentials),
          testMode,
        });
      },
    },
    webhooks: {
      parse: (input: WebhookParseInput): ParsedWebhook => {
        const resolvedProvider = input.provider ?? provider;
        const secrets = buildSecrets(resolvedProvider, config.credentials);
        const rawBody = input.rawBody;

        const adapter = providerAdapters[resolvedProvider];
        if (!adapter) {
          throw new Error(`Unsupported provider: ${resolvedProvider}`);
        }

        const parsed = adapter.parseWebhook({
          rawBody,
          headers: input.headers,
          secrets,
        });

        if (!parsed.isValid) {
          throw new StashError(
            "invalid_signature",
            `Invalid ${resolvedProvider} signature`
          );
        }

        return {
          event: parsed.event,
          provider: resolvedProvider,
          raw: parsed.raw,
        };
      },
    },
  };
}

function buildSecrets(
  provider: PaymentProvider,
  credentials: StashConfig["credentials"]
): PaymentRequest["secrets"] {
  if (provider === "ozow") {
    const ozow = credentials as StashConfig["credentials"] & {
      siteCode?: string;
      apiKey?: string;
      privateKey?: string;
    };
    return {
      siteCode: ozow.siteCode,
      apiKey: ozow.apiKey,
      privateKey: ozow.privateKey,
    };
  }

  const payfast = credentials as StashConfig["credentials"] & {
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
  };
  if (provider === "payfast") {
    return {
      merchantId: payfast.merchantId,
      merchantKey: payfast.merchantKey,
      passphrase: payfast.passphrase,
    };
  }

  const paystack = credentials as StashConfig["credentials"] & {
    secretKey?: string;
  };

  return {
    paystackSecretKey: paystack.secretKey,
  };
}


/**
 * @deprecated Use createStash({ provider, credentials }).payments.create instead.
 */
export async function makePayment(
  input: PaymentRequest
): Promise<PaymentResponse> {
  switch (input.provider) {
    case "ozow":
      return makeOzowPayment(input);
    case "payfast":
      return makePayfastPayment(input);
    case "paystack":
      return makePaystackPayment(input);
    default:
      throw new Error(`Unsupported provider: ${input.provider}`);
  }
}

/**
 * @deprecated Use createStash({ provider, credentials }).webhooks.parse instead.
 */
export function verifyWebhookSignature(
  input: WebhookVerifyInput
): WebhookVerifyResult {
  switch (input.provider) {
    case "ozow":
      return verifyOzowWebhook(input);
    case "payfast":
      return verifyPayfastWebhook(input);
    case "paystack": {
      const signature = resolveHeader(input.headers, "x-paystack-signature");
      const secretKey = input.secrets.paystackSecretKey;
      if (!input.rawBody || !secretKey) {
        return {
          provider: "paystack",
          isValid: false,
          reason: "missingPayload",
        };
      }

      return {
        provider: "paystack",
        isValid: verifyPaystackWebhook(input.rawBody, signature, secretKey),
      };
    }
    default:
      throw new Error(`Unsupported provider: ${input.provider}`);
  }
}

function resolveHeader(
  headers: WebhookVerifyInput["headers"],
  key: string
): string | undefined {
  if (!headers) return undefined;
  const lowerKey = key.toLowerCase();
  for (const [headerKey, value] of Object.entries(headers)) {
    if (headerKey.toLowerCase() !== lowerKey) continue;
    if (Array.isArray(value)) return value[0];
    return value;
  }
  return undefined;
}
