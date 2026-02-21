# Skills

## Common tasks

- Install: `npm install`
- Build: `npm run build`
- Test: `npm test`
- Run examples: `npx tsx examples/make-payment-ozow.ts`
- Env setup: copy `.env.example` and fill values

## Integration workflows

### Create a payment

Use `createStash` and `payments.create` with a configured provider.

- Ozow: `examples/make-payment-ozow.ts`
- Payfast: `examples/make-payment-payfast.ts`
- Paystack: `examples/make-payment-paystack.ts`

### Parse webhooks

Use `stash.webhooks.parse({ rawBody, headers })` and handle canonical events.

- Raw-body patterns: `docs/how-to/webhooks.md`
- Examples: `examples/webhook-ozow.ts`, `examples/webhook-payfast.ts`
- Paystack webhook: `examples/webhook-paystack.ts`

### Optional Ozow status check

Verify payment status after webhook processing.

- `examples/ozow-status.ts`

### Optional payment verification

- `payments.verify` is supported for Ozow and Paystack

## Troubleshooting

### Invalid signature (`invalid_signature`)

- Ensure raw body is captured before any parsing
- Avoid JSON parsing or body mutation prior to verification
- Preserve encoding and order for form-encoded payloads

### Payfast encoding issues

- URL encoding must use uppercase hex and spaces as `+`
- Verify field order matches Payfast docs

### Framework raw-body capture

- Express, Next.js Route Handlers, Fastify: `docs/how-to/webhooks.md`
