import assert from "node:assert/strict";
import { test } from "node:test";
import { providerCapabilities } from "../src/providers/capabilities.js";

test("providerCapabilities expose verify support", () => {
  assert.equal(providerCapabilities.ozow.supports?.verify, true);
  assert.equal(providerCapabilities.paystack.supports?.verify, true);
  assert.equal(providerCapabilities.payfast.supports?.verify, false);
});

test("providerCapabilities declare currency constraints", () => {
  assert.deepEqual(providerCapabilities.ozow.currencies, ["ZAR"]);
  assert.deepEqual(providerCapabilities.payfast.currencies, ["ZAR"]);
  assert.equal(providerCapabilities.paystack.currencies, undefined);
});

test("providerCapabilities mark required customer email", () => {
  assert.equal(providerCapabilities.paystack.requires?.customerEmail, true);
});
