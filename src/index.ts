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
  LogEvent,
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
  const logger = config.logger;

  const emit = (event: Omit<LogEvent, "timestamp"> & { timestamp?: string }) => {
    if (!logger) return;
    logger.log({
      timestamp: new Date().toISOString(),
      ...event,
    });
  };

  return {
    payments: {
      create: async (input: PaymentCreateInput): Promise<Payment> => {
        const correlationId = randomUUID();
        const startedAt = Date.now();
        const currency = input.currency ?? config.defaults?.currency ?? "ZAR";
        const amountNumber = Number(formatAmount(input.amount));

        emit({
          event: "payments.create.request",
          provider,
          action: "create",
          stage: "request",
          correlation_id: correlationId,
          status: "success",
          metadata: {
            amount: input.amount,
            currency,
            reference: input.reference,
            testMode,
          },
        });

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
        try {
          const response = await adapter.createPayment(paymentRequest);
          const payment = {
            id: randomUUID(),
            status: "pending",
            amount: amountNumber,
            currency,
            redirectUrl: response.redirectUrl,
            provider,
            providerRef: response.paymentRequestId,
            correlationId,
            raw: response.raw ?? response,
          } satisfies Payment;

          emit({
            event: "payments.create.response",
            provider,
            action: "create",
            stage: "response",
            correlation_id: correlationId,
            status: "success",
            duration_ms: Date.now() - startedAt,
            metadata: {
              amount: amountNumber,
              currency,
              reference: input.reference,
              provider_ref: response.paymentRequestId,
              testMode,
            },
          });

          return payment;
        } catch (error) {
          emit({
            event: "payments.create.error",
            provider,
            action: "create",
            stage: "error",
            correlation_id: correlationId,
            status: "failure",
            duration_ms: Date.now() - startedAt,
            metadata: {
              amount: input.amount,
              currency,
              reference: input.reference,
              testMode,
            },
            error: {
              code: error instanceof StashError ? error.code : "unknown",
              message: error instanceof Error ? error.message : "Unknown error",
            },
          });
          throw error;
        }
      },
      verify: async (input: PaymentVerifyInput): Promise<VerificationResult> => {
        const correlationId = randomUUID();
        const startedAt = Date.now();

        emit({
          event: "payments.verify.request",
          provider,
          action: "verify",
          stage: "request",
          correlation_id: correlationId,
          status: "success",
          metadata: {
            reference: input.reference,
            testMode,
          },
        });

        const adapter = providerAdapters[provider];
        if (!adapter?.verifyPayment) {
          const error = new StashError(
            "unsupported_capability",
            `payments.verify is not supported for ${provider}`
          );
          emit({
            event: "payments.verify.error",
            provider,
            action: "verify",
            stage: "error",
            correlation_id: correlationId,
            status: "failure",
            duration_ms: Date.now() - startedAt,
            metadata: {
              reference: input.reference,
              testMode,
            },
            error: {
              code: error.code,
              message: error.message,
            },
          });
          throw error;
        }

        try {
          const result = await adapter.verifyPayment({
            reference: input.reference,
            secrets: buildSecrets(provider, config.credentials),
            testMode,
          });

          const enriched = {
            ...result,
            correlationId,
          } satisfies VerificationResult;

          emit({
            event: "payments.verify.response",
            provider,
            action: "verify",
            stage: "response",
            correlation_id: correlationId,
            status: "success",
            duration_ms: Date.now() - startedAt,
            metadata: {
              reference: input.reference,
              provider_ref: result.providerRef,
              testMode,
            },
          });

          return enriched;
        } catch (error) {
          emit({
            event: "payments.verify.error",
            provider,
            action: "verify",
            stage: "error",
            correlation_id: correlationId,
            status: "failure",
            duration_ms: Date.now() - startedAt,
            metadata: {
              reference: input.reference,
              testMode,
            },
            error: {
              code: error instanceof StashError ? error.code : "unknown",
              message: error instanceof Error ? error.message : "Unknown error",
            },
          });
          throw error;
        }
      },
    },
    webhooks: {
      parse: (input: WebhookParseInput): ParsedWebhook => {
        const correlationId = randomUUID();
        const startedAt = Date.now();
        const resolvedProvider = input.provider ?? provider;
        const secrets = buildSecrets(resolvedProvider, config.credentials);
        const rawBody = input.rawBody;

        emit({
          event: "webhooks.parse.request",
          provider: resolvedProvider,
          action: "parse",
          stage: "request",
          correlation_id: correlationId,
          status: "success",
          metadata: {
            testMode,
          },
        });

        const adapter = providerAdapters[resolvedProvider];
        if (!adapter) {
          const error = new Error(`Unsupported provider: ${resolvedProvider}`);
          emit({
            event: "webhooks.parse.error",
            provider: resolvedProvider,
            action: "parse",
            stage: "error",
            correlation_id: correlationId,
            status: "failure",
            duration_ms: Date.now() - startedAt,
            metadata: {
              testMode,
            },
            error: {
              code: "unsupported_provider",
              message: error.message,
            },
          });
          throw error;
        }

        const parsed = adapter.parseWebhook({
          rawBody,
          headers: input.headers,
          secrets,
        });

        if (!parsed.isValid) {
          const error = new StashError(
            "invalid_signature",
            `Invalid ${resolvedProvider} signature`
          );
          emit({
            event: "webhooks.parse.error",
            provider: resolvedProvider,
            action: "parse",
            stage: "error",
            correlation_id: correlationId,
            status: "failure",
            duration_ms: Date.now() - startedAt,
            metadata: {
              testMode,
            },
            error: {
              code: error.code,
              message: error.message,
            },
          });
          throw error;
        }

        const response = {
          event: parsed.event,
          provider: resolvedProvider,
          correlationId,
          raw: parsed.raw,
        } satisfies ParsedWebhook;

        emit({
          event: "webhooks.parse.response",
          provider: resolvedProvider,
          action: "parse",
          stage: "response",
          correlation_id: correlationId,
          status: "success",
          duration_ms: Date.now() - startedAt,
          metadata: {
            amount: parsed.event.data.amount,
            currency: parsed.event.data.currency,
            reference: parsed.event.data.reference,
            provider_ref: parsed.event.data.providerRef,
            testMode,
          },
        });

        return response;
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
