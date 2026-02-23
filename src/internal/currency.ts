import { StashError } from "../errors.js";
import type { PaymentProvider } from "../types.js";

const DEFAULT_CURRENCY = "ZAR";

export function normalizeCurrency(
  inputCurrency?: string,
  fallbackCurrency: string = DEFAULT_CURRENCY
): string {
  const raw = inputCurrency?.trim() || fallbackCurrency;
  if (!raw) return DEFAULT_CURRENCY;
  return raw.toUpperCase();
}

export function assertProviderCurrency(
  provider: PaymentProvider,
  currency: string
): void {
  if (provider === "ozow" || provider === "payfast") {
    if (currency !== DEFAULT_CURRENCY) {
      throw new StashError(
        "unsupported_currency",
        `${provider} only supports ${DEFAULT_CURRENCY}. Received: ${currency}. Set currency: "${DEFAULT_CURRENCY}".`
      );
    }
  }
}
