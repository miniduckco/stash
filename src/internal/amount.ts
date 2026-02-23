const DEFAULT_EXPONENT = 2;

const CURRENCY_EXPONENTS: Record<string, number> = {
  ZAR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  NGN: 2,
};

function resolveExponent(currency?: string): number {
  if (!currency) return DEFAULT_EXPONENT;
  const normalized = currency.toUpperCase();
  return CURRENCY_EXPONENTS[normalized] ?? DEFAULT_EXPONENT;
}

function normalizeAmountString(
  value: string | number,
  exponent?: number
): string {
  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) {
    throw new Error("Amount must be a valid number");
  }

  if (raw.includes("e") || raw.includes("E")) {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      throw new Error("Amount must be a valid number");
    }
    if (exponent === undefined) {
      return String(numeric);
    }
    return numeric.toFixed(exponent);
  }

  return raw;
}

function assertNonNegative(raw: string): void {
  if (raw.startsWith("-")) {
    throw new Error("Amount must be a valid number");
  }
}

function ensureSafeInteger(value: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (value > max) {
    throw new Error("Amount is too large");
  }
  return Number(value);
}

export function parseMinorUnits(amount: string | number): number {
  const raw = normalizeAmountString(amount);
  assertNonNegative(raw);
  if (raw.includes(".")) {
    throw new Error("Amount in minor units must be an integer");
  }
  if (!/^[0-9]+$/.test(raw)) {
    throw new Error("Amount must be a valid number");
  }
  return ensureSafeInteger(BigInt(raw));
}

export function toMinorUnits(
  amount: string | number,
  currency?: string
): number {
  const exponent = resolveExponent(currency);
  const raw = normalizeAmountString(amount, exponent);
  assertNonNegative(raw);
  if (!/^[0-9]+(\.[0-9]+)?$/.test(raw)) {
    throw new Error("Amount must be a valid number");
  }

  const [whole, fracRaw = ""] = raw.split(".");
  if (fracRaw.length > exponent) {
    throw new Error("Amount has too many decimal places");
  }

  const fraction = fracRaw.padEnd(exponent, "0");
  const base = BigInt(whole || "0") * 10n ** BigInt(exponent);
  const minor = base + BigInt(fraction || "0");
  return ensureSafeInteger(minor);
}

export function fromMinorUnits(
  amount: string | number,
  currency?: string
): number {
  const exponent = resolveExponent(currency);
  const minor = parseMinorUnits(amount);
  return Number(minor) / 10 ** exponent;
}
