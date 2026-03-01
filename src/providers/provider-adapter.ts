import type {
  PaymentRequest,
  PaymentResponse,
  Subscription,
  SubscriptionCreateInput,
  SubscriptionPlan,
  SubscriptionPlanCreateInput,
  VerificationResult,
  WebhookEvent,
} from "../types.js";

export type ProviderWebhookInput = {
  rawBody: string | Buffer;
  headers?: Record<string, string | string[] | undefined>;
  secrets: PaymentRequest["secrets"];
};

export type ProviderWebhookResult = {
  isValid: boolean;
  event: WebhookEvent;
  raw: Record<string, unknown>;
};

export type ProviderVerifyInput = {
  reference: string;
  secrets: PaymentRequest["secrets"];
  testMode?: boolean;
};

export type ProviderPlanCreateInput = {
  secrets: PaymentRequest["secrets"];
} & SubscriptionPlanCreateInput;

export type ProviderSubscriptionCreateInput = {
  secrets: PaymentRequest["secrets"];
} & SubscriptionCreateInput;


export interface ProviderAdapter {
  id: PaymentRequest["provider"];
  createPayment(input: PaymentRequest): Promise<PaymentResponse>;
  parseWebhook(input: ProviderWebhookInput): ProviderWebhookResult;
  verifyPayment?: (input: ProviderVerifyInput) => Promise<VerificationResult>;
  createPlan?: (input: ProviderPlanCreateInput) => Promise<SubscriptionPlan>;
  createSubscription?: (
    input: ProviderSubscriptionCreateInput
  ) => Promise<Subscription>;
}
