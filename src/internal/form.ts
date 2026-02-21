import { decodeFormComponent } from "./encoding.js";

export type FormPair = [string, string];

function encodeFormComponent(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

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

export function parseFormBody(rawBody: string | Buffer): FormPair[] {
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
  return parseFormEncoded(text);
}

export function buildFormEncoded(
  payload: Record<string, string | number | boolean | null | undefined>
): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    pairs.push(
      `${encodeFormComponent(key)}=${encodeFormComponent(String(value))}`
    );
  }

  return pairs.join("&");
}
