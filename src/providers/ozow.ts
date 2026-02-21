import { sha512Hex } from "../internal/hash.js";
import { formatAmount, requireValue, toStringValue } from "../internal/guards.js";
import { parseFormEncoded, pairsToRecord } from "../internal/form.js";
import type {
  PaymentRequest,
  PaymentResponse,
  WebhookVerifyInput,
  WebhookVerifyResult,
  OzowTransactionQuery,
  OzowTransactionResult,
} from "../types.js";

const OZOW_ORDER = [
  "SiteCode",
  "CountryCode",
  "CurrencyCode",
  "Amount",
  "TransactionReference",
  "BankReference",
  "Optional1",
  "Optional2",
  "Optional3",
  "Optional4",
  "Optional5",
  "Customer",
  "CancelUrl",
  "ErrorUrl",
  "SuccessUrl",
  "NotifyUrl",
  "IsTest",
  "SelectedBankId",
  "BankAccountNumber",
  "BankAccountBranchCode",
  "BankAccountName",
  "BankName",
  "ExpiryDateUtc",
  "AllowVariableAmount",
  "VariableAmountMin",
  "VariableAmountMax",
  "CustomerIdentityNumber",
  "CustomerCellphoneNumber",
  "HashCheck",
  "Token",
  "GenerateShortUrl",
];

const OZOW_RESPONSE_ORDER = [
  "SiteCode",
  "TransactionId",
  "TransactionReference",
  "Amount",
  "Status",
  "Optional1",
  "Optional2",
  "Optional3",
  "Optional4",
  "Optional5",
  "CurrencyCode",
  "IsTest",
  "StatusMessage",
];

const OZOW_ALLOWED_FIELDS = new Set(OZOW_ORDER);

const OZOW_ENDPOINTS = {
  live: "https://api.ozow.com/PostPaymentRequest",
  sandbox: "https://stagingapi.ozow.com/PostPaymentRequest",
} as const;

const OZOW_STATUS_ENDPOINTS = {
  live: "https://api.ozow.com",
  sandbox: "https://stagingapi.ozow.com",
} as const;

function buildOzowPayload(input: PaymentRequest): Record<string, string> {
  const siteCode = requireValue(input.secrets.siteCode, "secrets.siteCode");
  const currency = (input.currency ?? "ZAR").toUpperCase();
  const country = "ZA";

  if (currency !== "ZAR") {
    throw new Error("Ozow only supports ZAR amounts");
  }

  const payload: Record<string, string> = {
    SiteCode: siteCode,
    CountryCode: country,
    CurrencyCode: currency,
    Amount: formatAmount(input.amount),
    TransactionReference: input.reference,
  };

  const bankReference =
    input.providerData?.BankReference ?? input.description ?? input.reference;
  payload.BankReference = toStringValue(bankReference);

  if (input.metadata) {
    const entries = Object.entries(input.metadata).slice(0, 5);
    entries.forEach(([, value], index) => {
      payload[`Optional${index + 1}`] = value;
    });
  }

  if (input.customer) {
    const fullName = [input.customer.firstName, input.customer.lastName]
      .filter(Boolean)
      .join(" ");
    if (fullName) {
      payload.Customer = fullName;
    }
    if (input.customer.phone) {
      payload.CustomerCellphoneNumber = input.customer.phone;
    }
  }

  if (input.urls?.cancelUrl) payload.CancelUrl = input.urls.cancelUrl;
  if (input.urls?.errorUrl) payload.ErrorUrl = input.urls.errorUrl;
  if (input.urls?.returnUrl) payload.SuccessUrl = input.urls.returnUrl;
  if (input.urls?.notifyUrl) payload.NotifyUrl = input.urls.notifyUrl;

  payload.IsTest = input.testMode ? "true" : "false";

  if (input.providerData) {
    for (const [key, value] of Object.entries(input.providerData)) {
      if (!OZOW_ALLOWED_FIELDS.has(key)) {
        throw new Error(`Unsupported Ozow field: ${key}`);
      }
      if (value === undefined || value === null) continue;
      if (key === "HashCheck") continue;
      payload[key] = toStringValue(value);
    }
  }

  return payload;
}

export function buildOzowHashCheck(
  payload: Record<string, string>,
  privateKey: string
): string {
  const parts: string[] = [];

  for (const key of OZOW_ORDER) {
    if (key === "HashCheck" || key === "Token") continue;
    if (key === "CustomerCellphoneNumber") continue;
    if (key === "GenerateShortUrl") continue;

    const value = payload[key];
    if (value === undefined || value === null || value === "") continue;
    if (
      key === "AllowVariableAmount" &&
      typeof value === "string" &&
      value.toLowerCase() === "false"
    ) {
      continue;
    }
    parts.push(toStringValue(value));
  }

  const concatenated = `${parts.join("")}${privateKey}`.toLowerCase();
  return sha512Hex(concatenated);
}

export async function makeOzowPayment(
  input: PaymentRequest
): Promise<PaymentResponse> {
  const apiKey = requireValue(input.secrets.apiKey, "secrets.apiKey");
  const privateKey = requireValue(input.secrets.privateKey, "secrets.privateKey");

  const payload = buildOzowPayload(input);
  payload.HashCheck = buildOzowHashCheck(payload, privateKey);

  const endpoint = input.testMode ? OZOW_ENDPOINTS.sandbox : OZOW_ENDPOINTS.live;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ApiKey: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      body?.ErrorMessage || body?.errorMessage || response.statusText;
    throw new Error(`Ozow payment request failed: ${errorMessage}`);
  }

  const paymentUrl = body?.PaymentUrl ?? body?.paymentUrl;
  if (!paymentUrl) {
    throw new Error("Ozow payment response missing PaymentUrl");
  }

  return {
    provider: "ozow",
    redirectUrl: paymentUrl,
    method: "GET",
    paymentRequestId: body?.PaymentRequestId ?? body?.paymentRequestId,
    raw: body,
  };
}

export function verifyOzowWebhook(
  input: WebhookVerifyInput
): WebhookVerifyResult {
  const privateKey = input.secrets.privateKey;
  if (!privateKey) {
    return {
      provider: "ozow",
      isValid: false,
      reason: "missingPrivateKey",
    };
  }

  const raw = input.rawBody
    ? Buffer.isBuffer(input.rawBody)
      ? input.rawBody.toString("utf8")
      : input.rawBody
    : null;

  const payload = raw
    ? pairsToRecord(parseFormEncoded(raw))
    : input.payload
      ? Object.entries(input.payload).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            if (value === undefined || value === null) return acc;
            acc[key] = toStringValue(value as string | number | boolean);
            return acc;
          },
          {}
        )
      : null;

  if (!payload) {
    return {
      provider: "ozow",
      isValid: false,
      reason: "missingPayload",
    };
  }

  const received = payload.HashCheck || payload.hashCheck;
  if (!received) {
    return {
      provider: "ozow",
      isValid: false,
      reason: "missingHashCheck",
    };
  }

  const parts = OZOW_RESPONSE_ORDER.map((key) => payload[key] ?? "");
  const concatenated = `${parts.join("")}${privateKey}`.toLowerCase();
  const computed = sha512Hex(concatenated);

  const normalize = (value: string) => value.replace(/^0+/, "").toLowerCase();

  return {
    provider: "ozow",
    isValid: normalize(received) === normalize(computed),
  };
}

function buildOzowStatusUrl(
  baseUrl: string,
  path: string,
  query: Record<string, string>
): string {
  const params = new URLSearchParams(query);
  return `${baseUrl}${path}?${params.toString()}`;
}

export async function getOzowTransactionByReference(
  input: OzowTransactionQuery
): Promise<OzowTransactionResult> {
  if (!input.transactionReference) {
    throw new Error("transactionReference is required");
  }

  const baseUrl = input.testMode
    ? OZOW_STATUS_ENDPOINTS.sandbox
    : OZOW_STATUS_ENDPOINTS.live;

  const url = buildOzowStatusUrl(baseUrl, "/GetTransactionByReference", {
    siteCode: input.siteCode,
    transactionReference: input.transactionReference,
    ...(input.testMode ? { isTest: "true" } : {}),
  });

  const response = await fetch(url, {
    headers: {
      ApiKey: input.apiKey,
      Accept: "application/json",
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Ozow transaction query failed: ${response.status} ${response.statusText}`
    );
  }

  return {
    transactions: Array.isArray(body) ? body : [],
    raw: body,
  };
}

export async function getOzowTransaction(
  input: OzowTransactionQuery
): Promise<OzowTransactionResult> {
  if (!input.transactionId) {
    throw new Error("transactionId is required");
  }

  const baseUrl = input.testMode
    ? OZOW_STATUS_ENDPOINTS.sandbox
    : OZOW_STATUS_ENDPOINTS.live;

  const url = buildOzowStatusUrl(baseUrl, "/GetTransaction", {
    siteCode: input.siteCode,
    transactionId: input.transactionId,
    ...(input.testMode ? { isTest: "true" } : {}),
  });

  const response = await fetch(url, {
    headers: {
      ApiKey: input.apiKey,
      Accept: "application/json",
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Ozow transaction query failed: ${response.status} ${response.statusText}`
    );
  }

  return {
    transactions: Array.isArray(body) ? body : [],
    raw: body,
  };
}
