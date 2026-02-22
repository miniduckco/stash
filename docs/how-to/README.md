# How-to guides

Each guide links to a runnable example in [`examples/`](../../examples/).

## Required environment variables

Ozow
- `OZOW_SITE_CODE`
- `OZOW_API_KEY`
- `OZOW_PRIVATE_KEY`

Payfast
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`

Paystack
- `PAYSTACK_SECRET_KEY`

You can copy [`.env.example`](../../.env.example) and fill in the values.

- Make a payment with Ozow: [`examples/make-payment-ozow.ts`](../../examples/make-payment-ozow.ts)
- Make a payment with Payfast: [`examples/make-payment-payfast.ts`](../../examples/make-payment-payfast.ts)
- Make a payment with Paystack: [`examples/make-payment-paystack.ts`](../../examples/make-payment-paystack.ts)
- Verify an Ozow webhook: [`examples/webhook-ozow.ts`](../../examples/webhook-ozow.ts)
- Verify a Payfast ITN: [`examples/webhook-payfast.ts`](../../examples/webhook-payfast.ts)
- Verify a Paystack webhook: [`examples/webhook-paystack.ts`](../../examples/webhook-paystack.ts)
- Verify webhooks safely (raw body): [docs/how-to/webhooks.md](webhooks.md)
- Check Ozow transaction status: [`examples/ozow-status.ts`](../../examples/ozow-status.ts)
- Use webhook form utilities: [`examples/webhook-utilities.ts`](../../examples/webhook-utilities.ts)
- Send provider-specific fields: [`examples/provider-data.ts`](../../examples/provider-data.ts)
