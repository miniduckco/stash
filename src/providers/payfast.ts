import { resolve4 } from "node:dns/promises";
import { encodePayfastValue } from "../internal/encoding.js";
import { md5Hex } from "../internal/hash.js";
import { formatAmount, requireValue, toStringValue } from "../internal/guards.js";
import { parseFormEncoded, pairsToRecord } from "../internal/form.js";
import type {
  PayfastWebhookValidationInput,
  PayfastWebhookValidationResult,
  PaymentRequest,
  PaymentResponse,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "../types.js";

const PAYFAST_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "fica_id_number",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
  "setup",
  "token",
  "return",
];

const PAYFAST_ALLOWED_FIELDS = new Set([...PAYFAST_ORDER, "signature"]);
const PAYFAST_SIGNATURE_EXCLUSIONS = new Set(["signature", "setup"]);

const PAYFAST_ENDPOINTS = {
  live: "https://www.payfast.co.za/eng/process",
  sandbox: "https://sandbox.payfast.co.za/eng/process",
} as const;

const PAYFAST_VALIDATION_ENDPOINTS = {
  live: "https://www.payfast.co.za/eng/query/validate",
  sandbox: "https://sandbox.payfast.co.za/eng/query/validate",
} as const;

const PAYFAST_VALID_HOSTS = [
  "www.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
  "sandbox.payfast.co.za",
];

type PayfastParamString = {
  paramString: string;
  payload: Record<string, string>;
};

function normalizePayfastFields(input: PaymentRequest): Record<string, string> {
  const merchantId = requireValue(input.secrets.merchantId, "secrets.merchantId");
  const merchantKey = requireValue(input.secrets.merchantKey, "secrets.merchantKey");
  const currency = (input.currency ?? "ZAR").toUpperCase();

  if (currency !== "ZAR") {
    throw new Error("Payfast only supports ZAR amounts");
  }

  const fields: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
  };

  if (input.urls?.returnUrl) fields.return_url = input.urls.returnUrl;
  if (input.urls?.cancelUrl) fields.cancel_url = input.urls.cancelUrl;
  if (input.urls?.notifyUrl) fields.notify_url = input.urls.notifyUrl;

  if (input.customer?.firstName) fields.name_first = input.customer.firstName;
  if (input.customer?.lastName) fields.name_last = input.customer.lastName;
  if (input.customer?.email) fields.email_address = input.customer.email;
  if (input.customer?.phone) fields.cell_number = input.customer.phone;

  fields.m_payment_id = input.reference;
  fields.amount = formatAmount(input.amount);

  const providerItemName = input.providerData?.item_name ?? undefined;
  const providerItemDescription = input.providerData?.item_description ?? undefined;

  const itemName =
    (providerItemName !== undefined
      ? toStringValue(providerItemName as string | number | boolean)
      : input.description) ?? input.reference;

  fields.item_name = itemName;

  if (providerItemDescription !== undefined) {
    fields.item_description = toStringValue(
      providerItemDescription as string | number | boolean
    );
  }

  if (input.metadata) {
    const entries = Object.entries(input.metadata).slice(0, 5);
    entries.forEach(([, value], index) => {
      fields[`custom_str${index + 1}`] = value;
    });
  }

  if (input.providerData) {
    for (const [key, value] of Object.entries(input.providerData)) {
      if (!PAYFAST_ALLOWED_FIELDS.has(key)) {
        throw new Error(`Unsupported Payfast field: ${key}`);
      }
      if (value === undefined || value === null) continue;
      if (key === "signature") continue;
      fields[key] = toStringValue(value);
    }
  }

  return fields;
}

export function buildPayfastSignature(
  fields: Record<string, string>,
  passphrase?: string
): string {
  const pairs: string[] = [];

  for (const key of PAYFAST_ORDER) {
    if (PAYFAST_SIGNATURE_EXCLUSIONS.has(key)) continue;
    const value = fields[key];
    if (value === undefined || value === null || value === "") continue;
    pairs.push(`${key}=${encodePayfastValue(String(value).trim())}`);
  }

  let paramString = pairs.join("&");
  if (passphrase) {
    paramString += `&passphrase=${encodePayfastValue(passphrase.trim())}`;
  }

  return md5Hex(paramString);
}

export function makePayfastPayment(input: PaymentRequest): PaymentResponse {
  const fields = normalizePayfastFields(input);
  const signature = buildPayfastSignature(fields, input.secrets.passphrase);
  fields.signature = signature;

  return {
    provider: "payfast",
    redirectUrl: input.testMode ? PAYFAST_ENDPOINTS.sandbox : PAYFAST_ENDPOINTS.live,
    method: "POST",
    formFields: fields,
  };
}

function buildPayfastParamString(raw: string): PayfastParamString {
  const pairs = parseFormEncoded(raw);
  const payload = pairsToRecord(pairs);

  const params: string[] = [];
  for (const [key, value] of pairs) {
    if (key === "signature") {
      break;
    }
    params.push(`${key}=${encodePayfastValue(value)}`);
  }

  return { payload, paramString: params.join("&") };
}

export function verifyPayfastWebhook(
  input: WebhookVerifyInput
): WebhookVerifyResult {
  const raw = input.rawBody
    ? Buffer.isBuffer(input.rawBody)
      ? input.rawBody.toString("utf8")
      : input.rawBody
    : null;

  if (!raw) {
    return {
      provider: "payfast",
      isValid: false,
      reason: "rawBodyRequired",
    };
  }

  const { payload, paramString } = buildPayfastParamString(raw);
  const signature = payload.signature;

  if (!signature) {
    return {
      provider: "payfast",
      isValid: false,
      reason: "missingSignature",
    };
  }

  let signatureString = paramString;
  if (input.secrets.passphrase) {
    signatureString += `&passphrase=${encodePayfastValue(input.secrets.passphrase)}`;
  }

  const computed = md5Hex(signatureString);

  return {
    provider: "payfast",
    isValid: signature.toLowerCase() === computed.toLowerCase(),
  };
}

async function isPayfastIpAllowed(
  ipAddress: string,
  allowedIps?: string[]
): Promise<boolean> {
  if (allowedIps && allowedIps.length > 0) {
    return allowedIps.includes(ipAddress);
  }

  const resolved = await Promise.all(
    PAYFAST_VALID_HOSTS.map(async (host) => {
      try {
        return await resolve4(host);
      } catch {
        return [] as string[];
      }
    })
  );

  const flattened = resolved.flat();
  return flattened.includes(ipAddress);
}

async function confirmPayfastServer(
  paramString: string,
  mode: "live" | "sandbox"
): Promise<boolean> {
  const endpoint = PAYFAST_VALIDATION_ENDPOINTS[mode];
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: paramString,
  });

  const text = await response.text();
  return text.trim() === "VALID";
}

export async function validatePayfastWebhook(
  input: PayfastWebhookValidationInput
): Promise<PayfastWebhookValidationResult> {
  const raw = Buffer.isBuffer(input.rawBody)
    ? input.rawBody.toString("utf8")
    : input.rawBody;

  const { payload, paramString } = buildPayfastParamString(raw);
  const signature = payload.signature;

  if (!signature) {
    return {
      isValid: false,
      signatureValid: false,
      reason: "missingSignature",
    };
  }

  const signatureString = input.passphrase
    ? `${paramString}&passphrase=${encodePayfastValue(input.passphrase)}`
    : paramString;

  const signatureValid =
    signature.toLowerCase() === md5Hex(signatureString).toLowerCase();

  if (input.validateSignature !== false && !signatureValid) {
    return {
      isValid: false,
      signatureValid,
      reason: "invalidSignature",
    };
  }

  let ipValid: boolean | undefined;
  if (input.validateIp) {
    if (!input.ipAddress) {
      return {
        isValid: false,
        signatureValid,
        reason: "missingIpAddress",
      };
    }

    ipValid = await isPayfastIpAllowed(input.ipAddress, input.allowedIps);
    if (!ipValid) {
      return {
        isValid: false,
        signatureValid,
        ipValid,
        reason: "invalidIpAddress",
      };
    }
  }

  let serverValid: boolean | undefined;
  if (input.validateServer !== false) {
    const mode = input.mode ?? "live";
    serverValid = await confirmPayfastServer(paramString, mode);
    if (!serverValid) {
      return {
        isValid: false,
        signatureValid,
        ipValid,
        serverValid,
        reason: "serverConfirmationFailed",
      };
    }
  }

  return {
    isValid: true,
    signatureValid,
    ipValid,
    serverValid,
  };
}
