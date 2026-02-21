# Examples

- Running examples
  - Requires Node 18+.
  - Use a TS runner like `tsx` or `ts-node`, or copy the code into your app.
  - Most examples expect env vars (see each file).

- make payment (Ozow API): `examples/make-payment-ozow.ts`
- make payment (Payfast form post): `examples/make-payment-payfast.ts`
- make payment (Paystack card checkout): `examples/make-payment-paystack.ts`
- verify webhook (Ozow): `examples/webhook-ozow.ts`
- verify webhook (Payfast ITN): `examples/webhook-payfast.ts`
- verify webhook (Paystack): `examples/webhook-paystack.ts`
- Ozow transaction status: `examples/ozow-status.ts`
- webhook utilities: `examples/webhook-utilities.ts`
- provider-specific fields: `examples/provider-data.ts`
