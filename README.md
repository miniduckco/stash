# @miniduckco/stash

Integrate payments in under 15 minutes.

## Install

```bash
npm install @miniduckco/stash
```

## Getting started

Start with the quickstart tutorial: `docs/tutorials/quickstart.md`.

## Quick examples

### Make a payment (Paystack)

```ts
import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "paystack",
  credentials: { secretKey: process.env.PAYSTACK_SECRET_KEY! },
});

const payment = await stash.payments.create({
  amount: "25.00",
  currency: "ZAR",
  reference: "ORDER-100",
  customer: { email: "buyer@example.com" },
  urls: { returnUrl: "https://example.com/return" },
});

console.log(payment.redirectUrl);
```

### Make a payment (Ozow)

```ts
import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "ozow",
  credentials: {
    siteCode: process.env.OZOW_SITE_CODE!,
    apiKey: process.env.OZOW_API_KEY!,
    privateKey: process.env.OZOW_PRIVATE_KEY!,
  },
});

const payment = await stash.payments.create({
  amount: "10.00",
  currency: "ZAR",
  reference: "ORDER-200",
  customer: { email: "buyer@example.com" },
  urls: { returnUrl: "https://example.com/return" },
});

console.log(payment.redirectUrl);
```

### Make a payment (Payfast)

```ts
import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID!,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
});

const payment = await stash.payments.create({
  amount: "10.00",
  currency: "ZAR",
  reference: "ORDER-300",
  customer: { email: "buyer@example.com" },
  urls: { returnUrl: "https://example.com/return" },
});

console.log(payment.redirectUrl);
```

### Create a subscription (Paystack)

```ts
const plan = await stash.subscriptions.plans.create({
  name: "Monthly Retainer",
  interval: "monthly",
  amount: "5000.00",
});

const subscription = await stash.subscriptions.create({
  customer: "CUS_xxxxxxxxxx",
  plan: plan.planCode,
});

console.log(subscription.status);
```

## Docs (Diataxis)

- Tutorials: `docs/tutorials/quickstart.md`
- How-to guides: `docs/how-to/README.md`
- Reference: `docs/reference/api.md`
- Explanation: `docs/explanation/architecture.md`
- Skills quick reference: `doc/skill.md`

## Examples

Runnable examples live in `examples/`:

- Index: `examples/README.md`

## Subscriptions (Paystack)

Subscriptions let you create recurring billing in Paystack using plans and subscriptions.

### Create a plan

```ts
import { createStash } from "@miniduckco/stash";

const stash = createStash({
  provider: "paystack",
  credentials: { secretKey: process.env.PAYSTACK_SECRET_KEY! },
});

const plan = await stash.subscriptions.plans.create({
  name: "Monthly Retainer",
  interval: "monthly",
  amount: "5000.00",
  amountUnit: "major",
  currency: "ZAR",
  invoiceLimit: 6,
});

console.log(plan.planCode);
```

### Create a subscription

```ts
const subscription = await stash.subscriptions.create({
  customer: "CUS_xxxxxxxxxx",
  plan: "PLN_xxxxxxxxxx",
  authorization: "AUTH_xxxxxxxxxx",
  startDate: "2026-04-01T00:00:00.000Z",
});

console.log(subscription.subscriptionCode, subscription.status);
```

### Webhook events

```ts
const parsed = stash.webhooks.parse({
  rawBody,
  headers,
});

if (parsed.event.type === "subscription.created") {
  const { subscriptionCode, customerCode, planCode } = parsed.event.data;
}

if (parsed.event.type === "invoice.payment_failed") {
  const { invoiceCode, subscriptionCode, amount, currency } = parsed.event.data;
}
```

Full example: `examples/subscriptions-paystack.ts`.

## Observability

Structured logging (opt-in) emits canonical events with correlation IDs and safe metadata. See
[Structured logging](docs/reference/api.md#structured-logging).

## Site (SvelteKit)

The landing page + docs site lives in `site/` and renders markdown directly from `docs/`.

Local dev:

```bash
npm install --prefix site
npm run dev --prefix site -- --host 0.0.0.0 --port 5173
```

Docker preview:

```bash
docker build -t stash-site .
docker run --rm -p 5173:5173 stash-site
```

## Providers and operations

Providers
- [x] Ozow
- [x] Payfast
- [x] Paystack
- [ ] Paygate
- [ ] Peach

Supported operations
- [x] payments.create
- [x] payments.verify (Ozow, Paystack; Payfast unsupported)
- [x] webhooks.parse
- [x] subscriptions.plans.create (Paystack)
- [x] subscriptions.create (Paystack)

Notes:
- Ozow hash excludes `CustomerCellphoneNumber`, `Token`, and `GenerateShortUrl`.
- Ozow `AllowVariableAmount=false` is excluded from the hash.
- Payfast signature excludes `setup` and requires uppercase URL encoding.
- Paystack subscriptions emit subscription + invoice webhook events.
