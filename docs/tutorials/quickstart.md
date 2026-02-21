# Quickstart

This walkthrough gets you from install to a successful payment in under 15 minutes.

## 1) Install

```bash
npm install @miniduck/stash
```

## 2) Create a payment

Choose a provider and use the unified `makePayment` API.

- Ozow example: `examples/make-payment-ozow.ts`
- Payfast example: `examples/make-payment-payfast.ts`

### Required environment variables

Ozow
- `OZOW_SITE_CODE`
- `OZOW_API_KEY`
- `OZOW_PRIVATE_KEY`

Payfast
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`

You can copy `.env.example` and fill in the values.

## 3) Handle webhooks

Verify the signature before you update your order.

- Ozow webhook: `examples/webhook-ozow.ts`
- Payfast ITN: `examples/webhook-payfast.ts`

## 4) Optional checks

- Ozow transaction status: `examples/ozow-status.ts`
