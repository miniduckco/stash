# Examples

Curated snippets for common Stash workflows. Full runnable examples live in
[`examples/`](https://github.com/miniduckco/stash/tree/main/examples).

## Payments

### Paystack payment

Create a card checkout payment and redirect the customer.

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

### Ozow payment

Create an Ozow payment request and redirect the customer.

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

### Payfast payment

Create a Payfast payment form post and redirect the customer.

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

## Subscriptions (Paystack)

Create a plan and subscribe an existing customer.

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
});

const subscription = await stash.subscriptions.create({
  customer: "CUS_xxxxxxxxxx",
  plan: plan.planCode,
  authorization: "AUTH_xxxxxxxxxx",
});

console.log(subscription.subscriptionCode, subscription.status);
```

## Webhooks

Parse payment and subscription events with a single handler.

```ts
const parsed = stash.webhooks.parse({ rawBody, headers });

if (parsed.event.type === "payment.completed") {
  console.log(parsed.event.data.reference);
}

if (parsed.event.type === "subscription.created") {
  console.log(parsed.event.data.subscriptionCode);
}
```

## Full examples

- Paystack subscriptions: `../examples/subscriptions-paystack.ts`
- Paystack payment: `../examples/make-payment-paystack.ts`
- Ozow payment: `../examples/make-payment-ozow.ts`
- Payfast payment: `../examples/make-payment-payfast.ts`
