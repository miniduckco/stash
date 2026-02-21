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

## 3) Handle webhooks

Verify the signature before you update your order.

- Ozow webhook: `examples/webhook-ozow.ts`
- Payfast ITN: `examples/webhook-payfast.ts`

## 4) Optional hardening

- Payfast ITN hardening: `examples/payfast-itn-hardening.ts`
- Ozow transaction status: `examples/ozow-status.ts`
