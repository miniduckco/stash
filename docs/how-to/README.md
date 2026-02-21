# How-to guides

Each guide links to a runnable example in `examples/`.

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

You can copy `.env.example` and fill in the values.

- Make a payment with Ozow: `examples/make-payment-ozow.ts`
- Make a payment with Payfast: `examples/make-payment-payfast.ts`
- Make a payment with Paystack: `examples/make-payment-paystack.ts`
- Verify an Ozow webhook: `examples/webhook-ozow.ts`
- Verify a Payfast ITN: `examples/webhook-payfast.ts`
- Verify a Paystack webhook: `examples/webhook-paystack.ts`
- Verify webhooks safely (raw body): `docs/how-to/webhooks.md`
- Check Ozow transaction status: `examples/ozow-status.ts`
- Use webhook form utilities: `examples/webhook-utilities.ts`
- Send provider-specific fields: `examples/provider-data.ts`
