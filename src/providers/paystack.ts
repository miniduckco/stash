import { createHmac } from "node:crypto";
import { requireValue } from "../internal/guards.js";
import type {
  PaystackProviderOptions,
  PaymentRequest,
  PaymentResponse,
  VerificationResult,
} from "../types.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function parseMinorAmount(amount: string | number): number {
  const raw = typeof amount === "string" ? amount : String(amount);
  if (raw.includes(".")) {
    throw new Error("Paystack amount must be in minor units (integer)");
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error("Paystack amount must be an integer in minor units");
  }
  return value;
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
  const email = input.customer?.email;
  if (!email) {
    throw new Error("Paystack requires customer email");
  }

  const amount = parseMinorAmount(input.amount);
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
      throw new Error("providerData overlaps providerOptions: channels");
    }
    for (const [key, value] of Object.entries(input.providerData)) {
      if (value === undefined || value === null) continue;
      if (key in payload) {
        throw new Error(`providerData overlaps core fields: ${key}`);
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
