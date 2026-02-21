import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { encodePayfastValue } from "../src/internal/encoding.js";
import { verifyPayfastWebhook } from "../src/providers/payfast.js";

test("encodePayfastValue uses uppercase hex and plus for spaces", () => {
  const value = "http://example.com/a b";
  assert.equal(
    encodePayfastValue(value),
    "http%3A%2F%2Fexample.com%2Fa+b"
  );
});

test("verifyPayfastWebhook validates ITN signature", () => {
  const pairs: Array<[string, string]> = [
    ["m_payment_id", "ORDER-100"],
    ["pf_payment_id", "1089250"],
    ["payment_status", "COMPLETE"],
    ["item_name", "Test product"],
    ["amount_gross", "200.00"],
    ["merchant_id", "10000100"],
  ];

  const paramString = pairs
    .map(([key, value]) => `${key}=${encodePayfastValue(value)}`)
    .join("&");

  const passphrase = "test-pass";
  const signature = createHash("md5")
    .update(`${paramString}&passphrase=${encodePayfastValue(passphrase)}`)
    .digest("hex");

  const rawBody = `${pairs
    .map(([key, value]) => `${key}=${encodePayfastValue(value)}`)
    .join("&")}&signature=${signature}`;

  const result = verifyPayfastWebhook({
    provider: "payfast",
    rawBody,
    secrets: { passphrase },
  });

  assert.equal(result.isValid, true);
});
