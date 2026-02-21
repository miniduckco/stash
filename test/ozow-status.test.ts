import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getOzowTransactionStatus,
  getOzowTransactionStatusByReference,
} from "../src/index.js";

test("getOzowTransactionStatusByReference uses staging endpoint in testMode", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = (async (url) => {
    capturedUrl = String(url);
    return {
      ok: true,
      json: async () => [],
    } as Response;
  }) as typeof fetch;

  await getOzowTransactionStatusByReference({
    siteCode: "SITE",
    apiKey: "API",
    transactionReference: "REF-1",
    testMode: true,
  });

  assert.equal(
    capturedUrl,
    "https://stagingapi.ozow.com/GetTransactionByReference?siteCode=SITE&transactionReference=REF-1&isTest=true"
  );

  globalThis.fetch = originalFetch;
});

test("getOzowTransactionStatus uses live endpoint by default", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";

  globalThis.fetch = (async (url) => {
    capturedUrl = String(url);
    return {
      ok: true,
      json: async () => [],
    } as Response;
  }) as typeof fetch;

  await getOzowTransactionStatus({
    siteCode: "SITE",
    apiKey: "API",
    transactionId: "TX-1",
  });

  assert.equal(
    capturedUrl,
    "https://api.ozow.com/GetTransaction?siteCode=SITE&transactionId=TX-1"
  );

  globalThis.fetch = originalFetch;
});
