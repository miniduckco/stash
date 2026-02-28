export class StashError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "StashError";
  }
}

export function missingRequiredField(field: string): StashError {
  return new StashError("missing_required_field", `Missing required field: ${field}`);
}

export function unsupportedCurrency(
  provider: string,
  currency: string,
  supported: string[]
): StashError {
  const normalizedCurrency = currency.toUpperCase();
  const supportedList = supported.map((value) => value.toUpperCase()).join(", ");
  return new StashError(
    "unsupported_currency",
    `Unsupported currency for ${provider}: ${normalizedCurrency}. Supported: ${supportedList}`
  );
}

export function invalidProviderData(message: string): StashError {
  return new StashError("invalid_provider_data", message);
}
