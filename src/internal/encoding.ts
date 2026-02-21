export function encodePayfastValue(value: string): string {
  const encoded = encodeURIComponent(value)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase())
    .replace(/%20/g, "+");

  return encoded;
}

export function decodeFormComponent(value: string): string {
  const replaced = value.replace(/\+/g, " ");
  return decodeURIComponent(replaced);
}
