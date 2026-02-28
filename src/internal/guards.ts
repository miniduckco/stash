import { missingRequiredField } from "../errors.js";

export function requireValue<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null || value === "") {
    throw missingRequiredField(name);
  }

  return value as T;
}

export function formatAmount(value: string | number): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("Amount must be a valid number");
  }
  return numeric.toFixed(2);
}

export function toStringValue(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}
