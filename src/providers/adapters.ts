import { fromMinorUnits } from "../internal/amount.js";
import { pairsToRecord, parseFormEncoded } from "../internal/form.js";
import type { PaymentRequest, VerificationResult, WebhookEvent } from "../types.js";
import { missingRequiredField } from "../errors.js";
import { makeOzowPayment, verifyOzowWebhook } from "./ozow.js";
import { makePayfastPayment, verifyPayfastWebhook } from "./payfast.js";
import {
  createPaystackPlan,
  makePaystackPayment,
  verifyPaystackPayment,
  verifyPaystackWebhook,
} from "./paystack.js";
import type {
  ProviderAdapter,
  ProviderWebhookInput,
  ProviderWebhookResult,
  ProviderVerifyInput,
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

function parsePaystackWebhook(
  input: ProviderWebhookInput
): ProviderWebhookResult {
  const signature = resolveHeader(input.headers, "x-paystack-signature");
  const secretKey = input.secrets.paystackSecretKey ?? "";
  const isValid = verifyPaystackWebhook(input.rawBody, signature, secretKey);

  const rawText = Buffer.isBuffer(input.rawBody)
    ? input.rawBody.toString("utf8")
    : input.rawBody;
  const payload = JSON.parse(rawText) as Record<string, unknown>;

  const event = mapPaystackEvent(payload as Record<string, unknown>);

  return {
    isValid,
    event,
    raw: payload,
  };
}

function mapPaystackEvent(payload: Record<string, unknown>): WebhookEvent {
  const eventType = String((payload as { event?: string }).event ?? "").toLowerCase();
  const type = eventType === "charge.success" ? "payment.completed" : "payment.failed";

  const data = (payload as { data?: Record<string, unknown> }).data ?? {};

  const currency = (data as { currency?: string }).currency
    ? String((data as { currency?: string }).currency)
    : undefined;

  const amountRaw = (data as { amount?: number | string }).amount;
  const amount =
    amountRaw === undefined || amountRaw === null
      ? undefined
      : fromMinorUnits(amountRaw, currency);

  return {
    type,
    data: {
      provider: "paystack",
      reference: String((data as { reference?: string }).reference ?? ""),
      providerRef: (data as { id?: string | number }).id
        ? String((data as { id?: string | number }).id)
        : undefined,
      amount,
      currency,
      raw: payload,
    },
  };
}

function resolveHeader(
  headers: ProviderWebhookInput["headers"],
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

async function verifyOzowPaymentByReference(
  input: ProviderVerifyInput
): Promise<VerificationResult> {
  const siteCode = input.secrets.siteCode;
  const apiKey = input.secrets.apiKey;
  if (!siteCode) {
    throw missingRequiredField("secrets.siteCode");
  }
  if (!apiKey) {
    throw missingRequiredField("secrets.apiKey");
  }

  const baseUrl = input.testMode
    ? "https://stagingapi.ozow.com"
    : "https://api.ozow.com";

  const url = new URL(`${baseUrl}/GetTransactionByReference`);
  url.searchParams.set("siteCode", siteCode);
  url.searchParams.set("transactionReference", input.reference);
  if (input.testMode) {
    url.searchParams.set("isTest", "true");
  }

  const response = await fetch(url.toString(), {
    headers: {
      ApiKey: apiKey,
      Accept: "application/json",
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Ozow verify failed: ${response.statusText}`);
  }

  const transaction = Array.isArray(body) ? body[0] : null;
  const statusRaw = String(transaction?.Status ?? "").toLowerCase();
  const status =
    statusRaw === "complete"
      ? "paid"
      : statusRaw === "cancelled" || statusRaw === "error"
        ? "failed"
        : statusRaw
          ? "pending"
          : "unknown";

  return {
    provider: "ozow",
    status,
    providerRef: transaction?.TransactionId,
    raw: body,
  };
}

async function verifyPaystackPaymentByReference(
  input: ProviderVerifyInput
): Promise<VerificationResult> {
  const secretKey = input.secrets.paystackSecretKey;
  if (!secretKey) {
    throw missingRequiredField("secrets.paystackSecretKey");
  }

  return verifyPaystackPayment(input.reference, secretKey);
}

export const ozowAdapter: ProviderAdapter = {
  id: "ozow",
  createPayment: async (input: PaymentRequest) => makeOzowPayment(input),
  parseWebhook: (input: ProviderWebhookInput) => parseOzowWebhook(input),
  verifyPayment: (input: ProviderVerifyInput) => verifyOzowPaymentByReference(input),
};

export const payfastAdapter: ProviderAdapter = {
  id: "payfast",
  createPayment: async (input: PaymentRequest) => makePayfastPayment(input),
  parseWebhook: (input: ProviderWebhookInput) => parsePayfastWebhook(input),
};

export const paystackAdapter: ProviderAdapter = {
  id: "paystack",
  createPayment: async (input: PaymentRequest) => makePaystackPayment(input),
  parseWebhook: (input: ProviderWebhookInput) => parsePaystackWebhook(input),
  verifyPayment: (input: ProviderVerifyInput) =>
    verifyPaystackPaymentByReference(input),
  createPlan: (input) => createPaystackPlan(input),
};

export const providerAdapters: Record<PaymentRequest["provider"], ProviderAdapter> =
  {
    ozow: ozowAdapter,
    payfast: payfastAdapter,
    paystack: paystackAdapter,
  };
