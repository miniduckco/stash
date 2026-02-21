import { randomUUID } from "node:crypto";
import {
  buildFormEncoded,
  pairsToRecord,
  parseFormBody,
  parseFormEncoded,
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

        const response = await makePayment(paymentRequest);

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

        if (resolvedProvider === "payfast") {
          const verified = verifyPayfastWebhook({
            provider: "payfast",
            rawBody,
            headers: input.headers,
            secrets: {
              passphrase: secrets.passphrase,
            },
          });

          if (!verified.isValid) {
            throw new StashError("invalid_signature", "Invalid Payfast signature");
          }

          const payload = parseWebhookPayload(rawBody);
          const event = mapPayfastEvent(payload);
          return {
            event,
            provider: "payfast",
            raw: payload,
          };
        }

        if (resolvedProvider === "ozow") {
          const verified = verifyOzowWebhook({
            provider: "ozow",
            rawBody,
            headers: input.headers,
            secrets: {
              privateKey: secrets.privateKey,
            },
          });

          if (!verified.isValid) {
            throw new StashError("invalid_signature", "Invalid Ozow signature");
          }

          const payload = parseWebhookPayload(rawBody);
          const event = mapOzowEvent(payload);
          return {
            event,
            provider: "ozow",
            raw: payload,
          };
        }

        throw new Error(`Unsupported provider: ${resolvedProvider}`);
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

function parseWebhookPayload(rawBody: string | Buffer): Record<string, string> {
  const raw = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
  return pairsToRecord(parseFormEncoded(raw));
}

function mapPayfastEvent(payload: Record<string, string>): WebhookEvent {
  const status = (payload.payment_status ?? "").toUpperCase();
  const type =
    status === "COMPLETE"
      ? "payment.completed"
      : status === "CANCELLED"
        ? "payment.cancelled"
        : "payment.failed";

  return {
    type,
    data: {
      provider: "payfast",
      reference: payload.m_payment_id ?? "",
      providerRef: payload.pf_payment_id,
      amount: payload.amount_gross ? Number(payload.amount_gross) : undefined,
      currency: payload.amount_gross ? "ZAR" : undefined,
      raw: payload,
    },
  };
}

function mapOzowEvent(payload: Record<string, string>): WebhookEvent {
  const status = (payload.Status ?? "").toLowerCase();
  const type =
    status === "complete"
      ? "payment.completed"
      : status === "cancelled"
        ? "payment.cancelled"
        : "payment.failed";

  return {
    type,
    data: {
      provider: "ozow",
      reference: payload.TransactionReference ?? "",
      providerRef: payload.TransactionId,
      amount: payload.Amount ? Number(payload.Amount) : undefined,
      currency: payload.CurrencyCode,
      raw: payload,
    },
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
