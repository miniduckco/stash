import type { PaymentProvider } from "../types.js";
import { StashError, missingRequiredField, unsupportedCurrency } from "../errors.js";

export type ProviderCapabilities = {
  currencies?: string[];
  requires?: {
    customerEmail?: boolean;
  };
  supports?: {
    verify?: boolean;
    webhooks?: boolean;
    subscriptions?: boolean;
    plans?: boolean;
  };
};

export const providerCapabilities: Record<PaymentProvider, ProviderCapabilities> = {
  ozow: {
    currencies: ["ZAR"],
    supports: {
      verify: true,
      webhooks: true,
      subscriptions: false,
      plans: false,
    },
  },
  payfast: {
    currencies: ["ZAR"],
    supports: {
      verify: false,
      webhooks: true,
      subscriptions: false,
      plans: false,
    },
  },
  paystack: {
    requires: {
      customerEmail: true,
    },
    supports: {
      verify: true,
      webhooks: true,
      subscriptions: true,
      plans: true,
    },
  },
};

export function requireSubscriptionSupport(provider: PaymentProvider): void {
  const supported = providerCapabilities[provider].supports?.subscriptions;
  if (supported) return;
  throw new StashError(
    "unsupported_capability",
    `subscriptions are not supported for ${provider}`
  );
}

export function requirePlanSupport(provider: PaymentProvider): void {
  const supported = providerCapabilities[provider].supports?.plans;
  if (supported) return;
  throw new StashError(
    "unsupported_capability",
    `subscription plans are not supported for ${provider}`
  );
}

export function requireSupportedCurrency(
  provider: PaymentProvider,
  currency: string
): void {
  const supported = providerCapabilities[provider].currencies;
  if (!supported || supported.length === 0) return;
  const normalized = currency.toUpperCase();
  if (!supported.map((value) => value.toUpperCase()).includes(normalized)) {
    throw unsupportedCurrency(provider, currency, supported);
  }
}

export function requireCustomerEmail(
  provider: PaymentProvider,
  email: string | undefined
): string {
  const needsEmail = providerCapabilities[provider].requires?.customerEmail;
  if (!needsEmail) {
    return email ?? "";
  }
  if (!email) {
    throw missingRequiredField("customer.email");
  }
  return email;
}
