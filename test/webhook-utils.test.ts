import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFormEncoded,
  parseFormBody,
  parseFormEncoded,
  pairsToRecord,
} from "../src/index.js";

test("buildFormEncoded encodes values with plus for spaces", () => {
  const encoded = buildFormEncoded({
    name: "Jane Doe",
    amount: 100,
  });

  assert.equal(encoded, "name=Jane+Doe&amount=100");
});

test("parseFormBody parses raw body into pairs", () => {
  const pairs = parseFormBody("name=Jane+Doe&amount=100");
  assert.deepEqual(pairs, [
    ["name", "Jane Doe"],
    ["amount", "100"],
  ]);
});

test("parseFormEncoded and pairsToRecord round-trip", () => {
  const pairs = parseFormEncoded("key=one&key2=two");
  const record = pairsToRecord(pairs);
  assert.deepEqual(record, { key: "one", key2: "two" });
});
