import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
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
  assert.match(payment.correlationId ?? "", /^[0-9a-f-]{36}$/i);
});

test("createStash emits canonical logs for payments.create", async () => {
  const events: Array<Record<string, unknown>> = [];
  const stash = createStash({
    provider: "payfast",
    credentials: {
      merchantId: "merchant",
      merchantKey: "key",
    },
    testMode: true,
    logger: {
      log: (event) => events.push(event as Record<string, unknown>),
    },
  });

  const payment = await stash.payments.create({
    amount: "100.00",
    currency: "ZAR",
    reference: "ORDER-1",
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].event, "payments.create.request");
  assert.equal(events[1].event, "payments.create.response");
  assert.equal(events[0].provider, "payfast");
  assert.equal(events[1].provider, "payfast");
  assert.equal(events[0].correlation_id, payment.correlationId);
  assert.equal(events[1].correlation_id, payment.correlationId);
  assert.equal((events[1].metadata as { testMode?: boolean }).testMode, true);
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

test("createStash payments.create maps paystack response", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          authorization_url: "https://checkout.paystack.com/abc",
          reference: "REF-1",
        },
      }),
    } as Response;
  }) as typeof fetch;

  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  const payment = await stash.payments.create({
    amount: "25.00",
    reference: "REF-1",
    customer: {
      email: "buyer@example.com",
    },
  });

  assert.equal(payment.provider, "paystack");
  assert.equal(payment.providerRef, "REF-1");
  assert.equal(payment.redirectUrl, "https://checkout.paystack.com/abc");

  globalThis.fetch = originalFetch;
});

test("createStash payments.create converts paystack major units", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (_url, init) => {
    const payload = JSON.parse(String(init?.body ?? "")) as { amount?: number };
    assert.equal(payload.amount, 2500);
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          authorization_url: "https://checkout.paystack.com/abc",
          reference: "REF-1",
        },
      }),
    } as Response;
  }) as typeof fetch;

  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  const payment = await stash.payments.create({
    amount: "25.00",
    reference: "REF-1",
    customer: {
      email: "buyer@example.com",
    },
  });

  assert.equal(payment.provider, "paystack");
  assert.equal(payment.providerRef, "REF-1");
  assert.equal(payment.redirectUrl, "https://checkout.paystack.com/abc");

  globalThis.fetch = originalFetch;
});

test("createStash payments.create accepts paystack minor units", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (_url, init) => {
    const payload = JSON.parse(String(init?.body ?? "")) as { amount?: number };
    assert.equal(payload.amount, 2500);
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          authorization_url: "https://checkout.paystack.com/def",
          reference: "REF-2",
        },
      }),
    } as Response;
  }) as typeof fetch;

  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  await stash.payments.create({
    amount: 2500,
    amountUnit: "minor",
    reference: "REF-2",
    customer: {
      email: "buyer@example.com",
    },
  });

  globalThis.fetch = originalFetch;
});

test("createStash payments.create requires paystack customer email", async () => {
  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  await assert.rejects(
    () =>
      stash.payments.create({
        amount: "25.00",
        reference: "REF-EMAIL",
      }),
    (error) =>
      error instanceof StashError &&
      error.code === "missing_required_field" &&
      error.message.includes("customer.email")
  );
});

test("createStash payments.create validates paystack email before provider call", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("fetch called");
  }) as typeof fetch;

  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  await assert.rejects(
    () =>
      stash.payments.create({
        amount: "25.00",
        reference: "REF-EMAIL",
      }),
    (error) =>
      error instanceof StashError &&
      error.code === "missing_required_field" &&
      error.message.includes("customer.email")
  );

  globalThis.fetch = originalFetch;
});

test("createStash payments.create normalizes currency", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (_url, init) => {
    const payload = JSON.parse(String(init?.body ?? "")) as { currency?: string };
    assert.equal(payload.currency, "ZAR");
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          authorization_url: "https://checkout.paystack.com/abc",
          reference: "REF-1",
        },
      }),
    } as Response;
  }) as typeof fetch;

  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  await stash.payments.create({
    amount: "25.00",
    currency: "zar",
    reference: "REF-1",
    customer: {
      email: "buyer@example.com",
    },
  });

  globalThis.fetch = originalFetch;
});

test("createStash payments.create enforces ZAR-only providers", async () => {
  const stash = createStash({
    provider: "payfast",
    credentials: {
      merchantId: "merchant",
      merchantKey: "key",
    },
  });

  await assert.rejects(
    () =>
      stash.payments.create({
        amount: "10.00",
        currency: "USD",
        reference: "ORDER-ZAR",
      }),
    (error) =>
      error instanceof StashError &&
      error.code === "unsupported_currency" &&
      error.message.includes("payfast")
  );
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
  assert.match(parsed.correlationId ?? "", /^[0-9a-f-]{36}$/i);
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

test("webhooks.parse returns canonical event for paystack", () => {
  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  const payload = {
    event: "charge.success",
    data: {
      reference: "REF-3",
      id: 555,
      amount: 2500,
      currency: "ZAR",
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha512", "sk_test")
    .update(rawBody, "utf8")
    .digest("hex");

  const parsed = stash.webhooks.parse({
    rawBody,
    headers: {
      "x-paystack-signature": signature,
    },
  });

  assert.equal(parsed.provider, "paystack");
  assert.equal(parsed.event.type, "payment.completed");
  assert.equal(parsed.event.data.reference, "REF-3");
  assert.equal(parsed.event.data.amount, 25);
  assert.match(parsed.correlationId ?? "", /^[0-9a-f-]{36}$/i);
});

test("webhooks.parse maps paystack subscription events", () => {
  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  const payload = {
    event: "subscription.create",
    data: {
      subscription_code: "SUB_123",
      customer: {
        customer_code: "CUS_456",
      },
      plan: {
        plan_code: "PLN_789",
      },
      amount: 50000,
      currency: "ZAR",
      status: "active",
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha512", "sk_test")
    .update(rawBody, "utf8")
    .digest("hex");

  const parsed = stash.webhooks.parse({
    rawBody,
    headers: {
      "x-paystack-signature": signature,
    },
  });

  assert.equal(parsed.event.type, "subscription.created");
  assert.equal(parsed.event.data.subscriptionCode, "SUB_123");
  assert.equal(parsed.event.data.customerCode, "CUS_456");
  assert.equal(parsed.event.data.planCode, "PLN_789");
  assert.equal(parsed.event.data.amount, 500);
  assert.equal(parsed.event.data.currency, "ZAR");
});

test("webhooks.parse maps paystack invoice events", () => {
  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  const payload = {
    event: "invoice.payment_failed",
    data: {
      invoice_code: "INV_123",
      subscription: {
        subscription_code: "SUB_321",
      },
      customer: {
        customer_code: "CUS_654",
      },
      plan: {
        plan_code: "PLN_987",
      },
      amount: 2500,
      currency: "ZAR",
      status: "failed",
    },
  };

  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha512", "sk_test")
    .update(rawBody, "utf8")
    .digest("hex");

  const parsed = stash.webhooks.parse({
    rawBody,
    headers: {
      "x-paystack-signature": signature,
    },
  });

  assert.equal(parsed.event.type, "invoice.payment_failed");
  assert.equal(parsed.event.data.invoiceCode, "INV_123");
  assert.equal(parsed.event.data.subscriptionCode, "SUB_321");
  assert.equal(parsed.event.data.customerCode, "CUS_654");
  assert.equal(parsed.event.data.planCode, "PLN_987");
  assert.equal(parsed.event.data.amount, 25);
  assert.equal(parsed.event.data.currency, "ZAR");
});

test("payments.verify throws unsupported_capability for payfast", async () => {
  const stash = createStash({
    provider: "payfast",
    credentials: {
      merchantId: "merchant",
      merchantKey: "key",
    },
  });

  await assert.rejects(
    () => stash.payments.verify({ reference: "ORDER-1" }),
    (error) => (error as StashError).code === "unsupported_capability"
  );
});

test("payments.verify returns paid for paystack", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: {
          status: "success",
          id: 123,
        },
      }),
    } as Response;
  }) as typeof fetch;

  const stash = createStash({
    provider: "paystack",
    credentials: {
      secretKey: "sk_test",
    },
  });

  const result = await stash.payments.verify({ reference: "REF-1" });
  assert.equal(result.status, "paid");
  assert.match(result.correlationId ?? "", /^[0-9a-f-]{36}$/i);

  globalThis.fetch = originalFetch;
});
