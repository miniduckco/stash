import type {
  PaymentRequest,
  PaymentResponse,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";
import { makeOzowPayment, verifyOzowWebhook } from "./providers/ozow.js";
import { makePayfastPayment, verifyPayfastWebhook } from "./providers/payfast.js";

export type {
  PaymentProvider,
  PaymentRequest,
  PaymentResponse,
  WebhookVerifyInput,
  WebhookVerifyResult,
} from "./types.js";

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
