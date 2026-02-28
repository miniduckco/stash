import { encodePayfastValue } from "../internal/encoding.js";
import { md5Hex } from "../internal/hash.js";
import { formatAmount, requireValue, toStringValue } from "../internal/guards.js";
import { parseFormEncoded, pairsToRecord } from "../internal/form.js";
import { invalidProviderData } from "../errors.js";
import { requireSupportedCurrency } from "./capabilities.js";
import type {
  PayfastProviderOptions,
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

const PAYFAST_PROVIDER_OPTION_FIELDS = {
  paymentMethod: "payment_method",
  emailConfirmation: "email_confirmation",
  confirmationAddress: "confirmation_address",
  mPaymentId: "m_payment_id",
  itemName: "item_name",
  itemDescription: "item_description",
} as const;

const PAYFAST_ENDPOINTS = {
  live: "https://www.payfast.co.za/eng/process",
  sandbox: "https://sandbox.payfast.co.za/eng/process",
} as const;

function normalizePayfastFields(input: PaymentRequest): Record<string, string> {
  const merchantId = requireValue(input.secrets.merchantId, "secrets.merchantId");
  const merchantKey = requireValue(input.secrets.merchantKey, "secrets.merchantKey");
  const currency = (input.currency ?? "ZAR").toUpperCase();

  requireSupportedCurrency("payfast", currency);

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

  fields.amount = formatAmount(input.amount);

  const providerOptions = input.providerOptions as PayfastProviderOptions | undefined;
  applyPayfastProviderOptions(fields, providerOptions, input.providerData);

  if (!fields.m_payment_id) {
    fields.m_payment_id = input.reference;
  }

  if (!fields.item_name) {
    fields.item_name = input.description ?? input.reference;
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
        throw invalidProviderData(`Unsupported Payfast field: ${key}`);
      }
      if (value === undefined || value === null) continue;
      if (key === "signature") continue;
      if (providerOptions && isPayfastProviderOptionField(key)) {
        throw invalidProviderData(`providerData overlaps providerOptions: ${key}`);
      }
      fields[key] = toStringValue(value);
    }
  }

  return fields;
}

function applyPayfastProviderOptions(
  fields: Record<string, string>,
  options?: PayfastProviderOptions,
  providerData?: Record<string, string | number | boolean | null | undefined>
): void {
  if (!options) return;

  for (const fieldKey of Object.values(PAYFAST_PROVIDER_OPTION_FIELDS)) {
    if (providerData && fieldKey in providerData) {
      throw invalidProviderData(`providerData overlaps providerOptions: ${fieldKey}`);
    }
  }

  if (options.paymentMethod) {
    fields.payment_method = options.paymentMethod;
  }

  if (options.emailConfirmation !== undefined) {
    fields.email_confirmation = options.emailConfirmation ? "1" : "0";
  }

  if (options.confirmationAddress) {
    fields.confirmation_address = options.confirmationAddress;
  }

  if (options.mPaymentId) {
    fields.m_payment_id = options.mPaymentId;
  }

  if (options.itemName) {
    fields.item_name = options.itemName;
  }

  if (options.itemDescription) {
    fields.item_description = options.itemDescription;
  }
}

function isPayfastProviderOptionField(fieldKey: string): boolean {
  const optionFields = Object.values(PAYFAST_PROVIDER_OPTION_FIELDS) as string[];
  return optionFields.includes(fieldKey);
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

  const pairs = parseFormEncoded(raw);
  const payload = pairsToRecord(pairs);
  const signature = payload.signature;

  if (!signature) {
    return {
      provider: "payfast",
      isValid: false,
      reason: "missingSignature",
    };
  }

  const params: string[] = [];
  for (const [key, value] of pairs) {
    if (key === "signature") {
      break;
    }
    params.push(`${key}=${encodePayfastValue(value)}`);
  }

  let paramString = params.join("&");
  if (input.secrets.passphrase) {
    paramString += `&passphrase=${encodePayfastValue(input.secrets.passphrase)}`;
  }

  const computed = md5Hex(paramString);

  return {
    provider: "payfast",
    isValid: signature.toLowerCase() === computed.toLowerCase(),
  };
}
