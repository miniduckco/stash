import { createHmac } from "node:crypto";
import { fromMinorUnits, parseMinorUnits, toMinorUnits } from "../internal/amount.js";
import { requireValue } from "../internal/guards.js";
import { invalidProviderData, missingRequiredField } from "../errors.js";
import { requireCustomerEmail } from "./capabilities.js";
import type {
  PaystackProviderOptions,
  PaymentRequest,
  PaymentResponse,
  SubscriptionPlan,
  SubscriptionPlanCreateInput,
  VerificationResult,
} from "../types.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function resolvePaystackAmount(input: PaymentRequest): number {
  const amountUnit = input.amountUnit ?? "major";
  if (amountUnit === "minor") {
    return parseMinorUnits(input.amount);
  }
  return toMinorUnits(input.amount, input.currency);
}

function resolvePaystackPlanAmount(input: SubscriptionPlanCreateInput): number {
  const amountUnit = input.amountUnit ?? "major";
  if (amountUnit === "minor") {
    return parseMinorUnits(input.amount);
  }
  return toMinorUnits(input.amount, input.currency);
}


function resolvePaystackOptions(
  input: PaymentRequest
): PaystackProviderOptions | undefined {
  return input.providerOptions as PaystackProviderOptions | undefined;
}

export async function makePaystackPayment(
  input: PaymentRequest
): Promise<PaymentResponse> {
  const secretKey = requireValue(
    input.secrets.paystackSecretKey,
    "secrets.paystackSecretKey"
  );
  const email = requireCustomerEmail("paystack", input.customer?.email);

  const amount = resolvePaystackAmount(input);
  const currency = input.currency ?? "ZAR";
  const options = resolvePaystackOptions(input);

  const payload: Record<string, unknown> = {
    email,
    amount,
    currency,
    reference: input.reference,
  };

  if (input.urls?.returnUrl) {
    payload.callback_url = input.urls.returnUrl;
  }

  if (options?.channels) {
    payload.channels = options.channels;
  }

  if (input.metadata) {
    payload.metadata = input.metadata;
  }

  if (input.providerData) {
    if (options?.channels && "channels" in input.providerData) {
      throw invalidProviderData("providerData overlaps providerOptions: channels");
    }
    for (const [key, value] of Object.entries(input.providerData)) {
      if (value === undefined || value === null) continue;
      if (key in payload) {
        throw invalidProviderData(`providerData overlaps core fields: ${key}`);
      }
      (payload as Record<string, unknown>)[key] = value;
    }
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.status) {
    const message = body?.message || response.statusText;
    throw new Error(`Paystack initialize failed: ${message}`);
  }

  const authUrl = body?.data?.authorization_url;
  const reference = body?.data?.reference;
  if (!authUrl || !reference) {
    throw new Error("Paystack response missing authorization_url or reference");
  }

  return {
    provider: "paystack",
    redirectUrl: authUrl,
    method: "GET",
    paymentRequestId: reference,
    raw: body,
  };
}

export async function createPaystackPlan(
  input: SubscriptionPlanCreateInput & { secrets: PaymentRequest["secrets"] }
): Promise<SubscriptionPlan> {
  const secretKey = requireValue(
    input.secrets.paystackSecretKey,
    "secrets.paystackSecretKey"
  );
  if (!input.name) {
    throw missingRequiredField("name");
  }
  if (!input.interval) {
    throw missingRequiredField("interval");
  }

  const amount = resolvePaystackPlanAmount(input);

  const payload: Record<string, unknown> = {
    name: input.name,
    interval: input.interval,
    amount,
  };

  if (input.currency) {
    payload.currency = input.currency;
  }

  if (input.invoiceLimit !== undefined) {
    payload.invoice_limit = input.invoiceLimit;
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/plan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.status) {
    const message = body?.message || response.statusText;
    throw new Error(`Paystack plan creation failed: ${message}`);
  }

  const data = body?.data ?? {};
  const planCode = data?.plan_code ?? data?.planCode;
  if (!planCode) {
    throw new Error("Paystack plan response missing plan_code");
  }

  const amountRaw = data?.amount;
  const currency = data?.currency ?? input.currency;
  const resolvedAmount =
    amountRaw === undefined || amountRaw === null
      ? fromMinorUnits(amount, currency)
      : fromMinorUnits(amountRaw, currency);

  return {
    provider: "paystack",
    planCode: String(planCode),
    name: String(data?.name ?? input.name),
    amount: Number.isFinite(resolvedAmount) ? resolvedAmount : 0,
    currency: currency ? String(currency) : undefined,
    interval: String(data?.interval ?? input.interval),
    raw: body,
  };
}


export function verifyPaystackWebhook(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secretKey: string
): boolean {
  if (!signatureHeader) {
    return false;
  }
  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const hash = createHmac("sha512", secretKey).update(payload).digest("hex");
  return hash === signatureHeader;
}

export async function verifyPaystackPayment(
  reference: string,
  secretKey: string
): Promise<VerificationResult> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
    }
  );

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.status) {
    const message = body?.message || response.statusText;
    throw new Error(`Paystack verify failed: ${message}`);
  }

  const status = String(body?.data?.status ?? "").toLowerCase();
  const normalized =
    status === "success"
      ? "paid"
      : status === "failed"
        ? "failed"
        : status === "abandoned"
          ? "pending"
          : "unknown";

  return {
    provider: "paystack",
    status: normalized,
    providerRef: body?.data?.id ? String(body.data.id) : undefined,
    raw: body,
  };
}
