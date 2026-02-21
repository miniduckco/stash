import { decodeFormComponent } from "./encoding.js";

export type FormPair = [string, string];

export function parseFormEncoded(raw: string): FormPair[] {
  if (!raw) {
    return [];
  }

  return raw
    .split("&")
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const index = pair.indexOf("=");
      if (index === -1) {
        return [decodeFormComponent(pair), ""] as FormPair;
      }
      const key = pair.slice(0, index);
      const value = pair.slice(index + 1);
      return [decodeFormComponent(key), decodeFormComponent(value)] as FormPair;
    });
}

export function pairsToRecord(pairs: FormPair[]): Record<string, string> {
  return pairs.reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}
