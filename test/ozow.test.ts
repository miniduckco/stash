import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { buildOzowHashCheck, verifyOzowWebhook } from "../src/providers/ozow.js";

test("buildOzowHashCheck excludes cellphone and allowVariableAmount false", () => {
  const payload = {
    SiteCode: "TSTSTE0001",
    CountryCode: "ZA",
    CurrencyCode: "ZAR",
    Amount: "25.00",
    TransactionReference: "123",
    BankReference: "ABC123",
    CancelUrl: "http://demo.ozow.com/cancel.aspx",
    ErrorUrl: "http://demo.ozow.com/error.aspx",
    SuccessUrl: "http://demo.ozow.com/success.aspx",
    NotifyUrl: "http://demo.ozow.com/notify.aspx",
    IsTest: "false",
    AllowVariableAmount: "false",
    CustomerCellphoneNumber: "0821234567",
  };

  const privateKey = "private-key";

  const expectedString =
    "TSTSTE0001" +
    "ZA" +
    "ZAR" +
    "25.00" +
    "123" +
    "ABC123" +
    "http://demo.ozow.com/cancel.aspx" +
    "http://demo.ozow.com/error.aspx" +
    "http://demo.ozow.com/success.aspx" +
    "http://demo.ozow.com/notify.aspx" +
    "false" +
    privateKey;

  const expectedHash = createHash("sha512")
    .update(expectedString.toLowerCase())
    .digest("hex");

  assert.equal(buildOzowHashCheck(payload, privateKey), expectedHash);
});

test("verifyOzowWebhook validates response hash", () => {
  const privateKey = "private-key";

  const payload = {
    SiteCode: "TSTSTE0001",
    TransactionId: "33857766-f29a-4a3a-a37e-66db3c42e439",
    TransactionReference: "ORDER-1",
    Amount: "25.00",
    Status: "Complete",
    Optional1: "",
    Optional2: "",
    Optional3: "",
    Optional4: "",
    Optional5: "",
    CurrencyCode: "ZAR",
    IsTest: "true",
    StatusMessage: "Payment successful",
  };

  const concatenated =
    payload.SiteCode +
    payload.TransactionId +
    payload.TransactionReference +
    payload.Amount +
    payload.Status +
    payload.Optional1 +
    payload.Optional2 +
    payload.Optional3 +
    payload.Optional4 +
    payload.Optional5 +
    payload.CurrencyCode +
    payload.IsTest +
    payload.StatusMessage +
    privateKey;

  const hash = createHash("sha512")
    .update(concatenated.toLowerCase())
    .digest("hex");

  const result = verifyOzowWebhook({
    provider: "ozow",
    payload: { ...payload, HashCheck: hash },
    secrets: { privateKey },
  });

  assert.equal(result.isValid, true);
});
