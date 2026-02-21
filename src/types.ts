export type PaymentProvider = "ozow" | "payfast" | "paystack";

export type PayfastProviderOptions = {
  paymentMethod?: string;
  emailConfirmation?: boolean;
  confirmationAddress?: string;
  mPaymentId?: string;
  itemName?: string;
  itemDescription?: string;
};

export type PaystackProviderOptions = {
  channels?: string[];
};

export type OzowProviderOptions = {
  selectedBankId?: string;
  customerIdentityNumber?: string;
  allowVariableAmount?: boolean;
  variableAmountMin?: number;
  variableAmountMax?: number;
};

export type ProviderOptions =
  | PayfastProviderOptions
  | OzowProviderOptions
  | PaystackProviderOptions;

export type OzowCredentials = {
  siteCode: string;
  apiKey: string;
  privateKey: string;
};

export type PayfastCredentials = {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
};

export type PaystackCredentials = {
  secretKey: string;
};

export type StashConfig = {
  provider: PaymentProvider;
  credentials: OzowCredentials | PayfastCredentials | PaystackCredentials;
  testMode?: boolean;
  defaults?: {
    currency?: string;
  };
};

export type PaymentCreateInput = {
  amount: string | number;
  currency?: "ZAR" | string;
  reference: string;
  description?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  urls?: {
    returnUrl?: string;
    cancelUrl?: string;
    notifyUrl?: string;
    errorUrl?: string;
  };
  metadata?: Record<string, string>;
  providerOptions?: ProviderOptions;
  providerData?: Record<string, string | number | boolean | null | undefined>;
};

export type Payment = {
  id: string;
  status: "pending" | "paid" | "failed";
  amount: number;
  currency: string;
  redirectUrl?: string;
  provider: PaymentProvider;
  providerRef?: string;
  raw?: unknown;
};

export type PaymentVerifyInput = {
  reference: string;
};

export type VerificationResult = {
  provider: PaymentProvider;
  status: "pending" | "paid" | "failed" | "unknown";
  providerRef?: string;
  raw?: unknown;
};

export type WebhookEvent = {
  type: "payment.completed" | "payment.failed" | "payment.cancelled";
  data: {
    id?: string;
    providerRef?: string;
    reference: string;
    amount?: number;
    currency?: string;
    provider: PaymentProvider;
    raw: unknown;
  };
};

export type WebhookParseInput = {
  provider?: PaymentProvider;
  rawBody: string | Buffer;
  headers?: Record<string, string | string[] | undefined>;
};

export type ParsedWebhook = {
  event: WebhookEvent;
  provider: PaymentProvider;
  raw: Record<string, unknown>;
};

export type PaymentRequest = {
  provider: PaymentProvider;
  amount: string | number;
  currency?: "ZAR" | string;
  reference: string;
  description?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  urls?: {
    returnUrl?: string;
    cancelUrl?: string;
    notifyUrl?: string;
    errorUrl?: string;
  };
  metadata?: Record<string, string>;
  secrets: {
    siteCode?: string;
    apiKey?: string;
    privateKey?: string;
    merchantId?: string;
    merchantKey?: string;
    passphrase?: string;
    paystackSecretKey?: string;
  };
  providerOptions?: ProviderOptions;
  testMode?: boolean;
  providerData?: Record<string, string | number | boolean | null | undefined>;
};

export type PaymentResponse = {
  provider: PaymentProvider;
  redirectUrl: string;
  method: "GET" | "POST";
  formFields?: Record<string, string>;
  paymentRequestId?: string;
  raw?: unknown;
};

export type WebhookVerifyInput = {
  provider: PaymentProvider;
  rawBody?: string | Buffer;
  payload?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  secrets: {
    privateKey?: string;
    passphrase?: string;
    paystackSecretKey?: string;
  };
};

export type WebhookVerifyResult = {
  provider: PaymentProvider;
  isValid: boolean;
  reason?: string;
};
