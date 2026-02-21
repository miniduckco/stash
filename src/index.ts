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
  PaymentRequest,
  PaymentResponse,
  StashConfig,
  WebhookEvent,
  WebhookParseInput,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";
import { providerAdapters } from "./providers/adapters.js";
import { makeOzowPayment, verifyOzowWebhook } from "./providers/ozow.js";
import { makePayfastPayment, verifyPayfastWebhook } from "./providers/payfast.js";

export type {
  OzowProviderOptions,
  ParsedWebhook,
  Payment,
  PaymentCreateInput,
  PaymentProvider,
  PaymentRequest,
  PaymentResponse,
  PayfastProviderOptions,
  ProviderOptions,
  StashConfig,
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
  return {
    merchantId: payfast.merchantId,
    merchantKey: payfast.merchantKey,
    passphrase: payfast.passphrase,
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
    default:
      throw new Error(`Unsupported provider: ${input.provider}`);
  }
}
