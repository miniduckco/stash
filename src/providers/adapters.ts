import { pairsToRecord, parseFormEncoded } from "../internal/form.js";
import type { PaymentRequest, WebhookEvent } from "../types.js";
import { makeOzowPayment, verifyOzowWebhook } from "./ozow.js";
import { makePayfastPayment, verifyPayfastWebhook } from "./payfast.js";
import type {
  ProviderAdapter,
  ProviderWebhookInput,
  ProviderWebhookResult,
} from "./provider-adapter.js";

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

function parsePayfastWebhook(input: ProviderWebhookInput): ProviderWebhookResult {
  const verified = verifyPayfastWebhook({
    provider: "payfast",
    rawBody: input.rawBody,
    headers: input.headers,
    secrets: {
      passphrase: input.secrets.passphrase,
    },
  });

  const payload = parseWebhookPayload(input.rawBody);
  return {
    isValid: verified.isValid,
    event: mapPayfastEvent(payload),
    raw: payload,
  };
}

function parseOzowWebhook(input: ProviderWebhookInput): ProviderWebhookResult {
  const verified = verifyOzowWebhook({
    provider: "ozow",
    rawBody: input.rawBody,
    headers: input.headers,
    secrets: {
      privateKey: input.secrets.privateKey,
    },
  });

  const payload = parseWebhookPayload(input.rawBody);
  return {
    isValid: verified.isValid,
    event: mapOzowEvent(payload),
    raw: payload,
  };
}

export const ozowAdapter: ProviderAdapter = {
  id: "ozow",
  createPayment: async (input: PaymentRequest) => makeOzowPayment(input),
  parseWebhook: (input: ProviderWebhookInput) => parseOzowWebhook(input),
};

export const payfastAdapter: ProviderAdapter = {
  id: "payfast",
  createPayment: async (input: PaymentRequest) => makePayfastPayment(input),
  parseWebhook: (input: ProviderWebhookInput) => parsePayfastWebhook(input),
};

export const providerAdapters: Record<PaymentRequest["provider"], ProviderAdapter> =
  {
    ozow: ozowAdapter,
    payfast: payfastAdapter,
  };
