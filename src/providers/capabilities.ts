import type { PaymentProvider } from "../types.js";
import { missingRequiredField, unsupportedCurrency } from "../errors.js";

export type ProviderCapabilities = {
  currencies?: string[];
  requires?: {
    customerEmail?: boolean;
  };
  supports?: {
    verify?: boolean;
    webhooks?: boolean;
  };
};

export const providerCapabilities: Record<PaymentProvider, ProviderCapabilities> = {
  ozow: {
    currencies: ["ZAR"],
    supports: {
      verify: true,
      webhooks: true,
    },
  },
  payfast: {
    currencies: ["ZAR"],
    supports: {
      verify: false,
      webhooks: true,
    },
  },
  paystack: {
    requires: {
      customerEmail: true,
    },
    supports: {
      verify: true,
      webhooks: true,
    },
  },
};

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
