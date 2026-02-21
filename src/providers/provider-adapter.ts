import type { PaymentRequest, PaymentResponse, WebhookEvent } from "../types.js";

export type ProviderWebhookInput = {
  rawBody: string | Buffer;
  headers?: Record<string, string | string[] | undefined>;
  secrets: PaymentRequest["secrets"];
};

export type ProviderWebhookResult = {
  isValid: boolean;
  event: WebhookEvent;
  raw: Record<string, string>;
};

export interface ProviderAdapter {
  id: PaymentRequest["provider"];
  createPayment(input: PaymentRequest): Promise<PaymentResponse>;
  parseWebhook(input: ProviderWebhookInput): ProviderWebhookResult;
}
