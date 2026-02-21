import { createHash } from "node:crypto";

export function sha512Hex(input: string): string {
  return createHash("sha512").update(input).digest("hex");
}

export function md5Hex(input: string): string {
  return createHash("md5").update(input).digest("hex");
}
