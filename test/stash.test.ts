import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { createStash, StashError } from "../src/index.js";
import { encodePayfastValue } from "../src/internal/encoding.js";

test("createStash payments.create returns canonical payment", async () => {
  const stash = createStash({
    provider: "payfast",
    credentials: {
      merchantId: "merchant",
      merchantKey: "key",
    },
    testMode: true,
  });

  const payment = await stash.payments.create({
    amount: "100.00",
    currency: "ZAR",
    reference: "ORDER-1",
  });

  assert.equal(payment.status, "pending");
  assert.equal(payment.currency, "ZAR");
  assert.equal(payment.provider, "payfast");
  assert.match(payment.id, /^[0-9a-f-]{36}$/i);
  assert.ok(payment.redirectUrl);
});

test("createStash payments.create maps ozow response", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        PaymentUrl: "https://pay.ozow.com/123",
        PaymentRequestId: "REQ-1",
      }),
    } as Response;
  }) as typeof fetch;

  const stash = createStash({
    provider: "ozow",
    credentials: {
      siteCode: "SITE",
      apiKey: "API",
      privateKey: "PRIVATE",
    },
  });

  const payment = await stash.payments.create({
    amount: "10.00",
    reference: "ORDER-2",
  });

  assert.equal(payment.provider, "ozow");
  assert.equal(payment.providerRef, "REQ-1");
  assert.equal(payment.redirectUrl, "https://pay.ozow.com/123");

  globalThis.fetch = originalFetch;
});

test("webhooks.parse returns canonical event for payfast", () => {
  const stash = createStash({
    provider: "payfast",
    credentials: {
      merchantId: "merchant",
      merchantKey: "key",
      passphrase: "test-pass",
    },
  });

  const pairs: Array<[string, string]> = [
    ["m_payment_id", "ORDER-100"],
    ["pf_payment_id", "1089250"],
    ["payment_status", "COMPLETE"],
    ["amount_gross", "200.00"],
    ["merchant_id", "10000100"],
  ];

  const paramString = pairs
    .map(([key, value]) => `${key}=${encodePayfastValue(value)}`)
    .join("&");

  const signature = createHash("md5")
    .update(`${paramString}&passphrase=${encodePayfastValue("test-pass")}`)
    .digest("hex");

  const rawBody = `${pairs
    .map(([key, value]) => `${key}=${encodePayfastValue(value)}`)
    .join("&")}&signature=${signature}`;

  const parsed = stash.webhooks.parse({ rawBody });

  assert.equal(parsed.event.type, "payment.completed");
  assert.equal(parsed.event.data.reference, "ORDER-100");
  assert.equal(parsed.provider, "payfast");
});

test("webhooks.parse throws invalid_signature for payfast", () => {
  const stash = createStash({
    provider: "payfast",
    credentials: {
      merchantId: "merchant",
      merchantKey: "key",
      passphrase: "test-pass",
    },
  });

  const rawBody = "payment_status=COMPLETE";

  assert.throws(() => stash.webhooks.parse({ rawBody }), (error) => {
    const stashError = error as StashError;
    return stashError.code === "invalid_signature";
  });
});
