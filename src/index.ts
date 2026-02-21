import type {
  OzowTransactionQuery,
  OzowTransactionResult,
  PayfastWebhookValidationInput,
  PayfastWebhookValidationResult,
  PaymentRequest,
  PaymentResponse,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";
import {
  getOzowTransaction,
  getOzowTransactionByReference,
  makeOzowPayment,
  verifyOzowWebhook,
} from "./providers/ozow.js";
import {
  makePayfastPayment,
  validatePayfastWebhook,
  verifyPayfastWebhook,
} from "./providers/payfast.js";

export type {
  OzowTransactionQuery,
  OzowTransactionResult,
  PayfastWebhookValidationInput,
  PayfastWebhookValidationResult,
  PaymentProvider,
  PaymentRequest,
  PaymentResponse,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";

export {
  buildFormEncoded,
  parseFormBody,
  parseFormEncoded,
  pairsToRecord,
} from "./internal/form.js";

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

export async function validatePayfastWebhookSignature(
  input: PayfastWebhookValidationInput
): Promise<PayfastWebhookValidationResult> {
  return validatePayfastWebhook(input);
}

export async function getOzowTransactionStatusByReference(
  input: OzowTransactionQuery
): Promise<OzowTransactionResult> {
  return getOzowTransactionByReference(input);
}

export async function getOzowTransactionStatus(
  input: OzowTransactionQuery
): Promise<OzowTransactionResult> {
  return getOzowTransaction(input);
}
