export type PaymentProvider = "ozow" | "payfast";

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
  };
  providerOptions?: PayfastProviderOptions | OzowProviderOptions;
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
  };
};

export type WebhookVerifyResult = {
  provider: PaymentProvider;
  isValid: boolean;
  reason?: string;
};

export type PayfastProviderOptions = {
  paymentMethod?: string;
  emailConfirmation?: boolean;
  confirmationAddress?: string;
  mPaymentId?: string;
  itemName?: string;
  itemDescription?: string;
};

export type OzowProviderOptions = {
  selectedBankId?: string;
  customerIdentityNumber?: string;
  allowVariableAmount?: boolean;
  variableAmountMin?: number;
  variableAmountMax?: number;
};
