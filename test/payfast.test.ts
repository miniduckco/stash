import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { encodePayfastValue } from "../src/internal/encoding.js";
import { StashError } from "../src/errors.js";
import { makePayfastPayment, verifyPayfastWebhook } from "../src/providers/payfast.js";

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

test("makePayfastPayment maps providerOptions", () => {
  const payment = makePayfastPayment({
    provider: "payfast",
    amount: "100.00",
    reference: "ORDER-1",
    description: "Order #1",
    secrets: {
      merchantId: "merchant",
      merchantKey: "key",
    },
    providerOptions: {
      paymentMethod: "cc",
      emailConfirmation: true,
      confirmationAddress: "ops@example.com",
      mPaymentId: "MP-1",
      itemName: "Custom Item",
      itemDescription: "Custom Desc",
    },
  });

  assert.equal(payment.formFields?.payment_method, "cc");
  assert.equal(payment.formFields?.email_confirmation, "1");
  assert.equal(payment.formFields?.confirmation_address, "ops@example.com");
  assert.equal(payment.formFields?.m_payment_id, "MP-1");
  assert.equal(payment.formFields?.item_name, "Custom Item");
  assert.equal(payment.formFields?.item_description, "Custom Desc");
});

test("makePayfastPayment rejects providerData overlap", () => {
  assert.throws(
    () => {
      makePayfastPayment({
        provider: "payfast",
        amount: "100.00",
        reference: "ORDER-2",
        secrets: {
          merchantId: "merchant",
          merchantKey: "key",
        },
        providerOptions: {
          paymentMethod: "cc",
        },
        providerData: {
          payment_method: "dc",
        },
      });
    },
    (error) =>
      error instanceof StashError &&
      error.code === "invalid_provider_data" &&
      error.message.includes("providerData overlaps providerOptions")
  );
});
