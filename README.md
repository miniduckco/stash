# @miniduck/stash

Unified payments SDK for South Africa (Ozow + Payfast).

## Install

```bash
npm install @miniduck/stash
```

## Make a payment

### Ozow (API)

```ts
import { makePayment } from "@miniduck/stash";

const payment = await makePayment({
  provider: "ozow",
  amount: "249.99",
  currency: "ZAR",
  reference: "ORDER-12345",
  customer: {
    firstName: "Lebo",
    lastName: "Nkosi",
    phone: "0821234567",
  },
  urls: {
    returnUrl: "https://shop.example.com/payments/return",
    cancelUrl: "https://shop.example.com/payments/cancel",
    notifyUrl: "https://shop.example.com/payments/webhook",
    errorUrl: "https://shop.example.com/payments/error",
  },
  secrets: {
    siteCode: process.env.OZOW_SITE_CODE,
    apiKey: process.env.OZOW_API_KEY,
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
  testMode: true,
});

// Redirect the customer to payment.redirectUrl
```

### Payfast (form post)

```ts
import { makePayment } from "@miniduck/stash";

const payment = await makePayment({
  provider: "payfast",
  amount: "249.99",
  currency: "ZAR",
  reference: "ORDER-12345",
  description: "Order #12345",
  customer: {
    firstName: "Lebo",
    lastName: "Nkosi",
    email: "lebo@example.com",
  },
  urls: {
    returnUrl: "https://shop.example.com/payments/return",
    cancelUrl: "https://shop.example.com/payments/cancel",
    notifyUrl: "https://shop.example.com/payments/webhook",
  },
  secrets: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
  testMode: true,
});

// Build an HTML form with payment.formFields
// Post to payment.redirectUrl
```

## Verify webhook signature

### Ozow

```ts
import { verifyWebhookSignature } from "@miniduck/stash";

const result = verifyWebhookSignature({
  provider: "ozow",
  rawBody: req.rawBody, // Buffer or string
  secrets: {
    privateKey: process.env.OZOW_PRIVATE_KEY,
  },
});

if (!result.isValid) {
  res.status(400).send("Invalid signature");
  return;
}
```

#### Ozow transaction status check (recommended)

```ts
import { getOzowTransactionStatusByReference } from "@miniduck/stash";

const status = await getOzowTransactionStatusByReference({
  siteCode: process.env.OZOW_SITE_CODE,
  apiKey: process.env.OZOW_API_KEY,
  transactionReference: "ORDER-12345",
  testMode: true,
});

console.log(status.transactions);
```

### Payfast (ITN)

```ts
import {
  validatePayfastWebhookSignature,
  verifyWebhookSignature,
} from "@miniduck/stash";

const result = verifyWebhookSignature({
  provider: "payfast",
  rawBody: req.rawBody, // required to preserve field order
  secrets: {
    passphrase: process.env.PAYFAST_PASSPHRASE,
  },
});

if (!result.isValid) {
  res.status(400).send("Invalid signature");
  return;
}
```

#### Payfast ITN hardening (signature + server confirmation)

```ts
import { validatePayfastWebhookSignature } from "@miniduck/stash";

const validation = await validatePayfastWebhookSignature({
  rawBody: req.rawBody,
  passphrase: process.env.PAYFAST_PASSPHRASE,
  mode: "sandbox",
  validateServer: true,
});

if (!validation.isValid) {
  res.status(400).send("Invalid ITN");
  return;
}
```

## Provider-specific fields

Pass provider-specific fields via `providerData`:

```ts
await makePayment({
  provider: "payfast",
  amount: "100.00",
  reference: "ORDER-1",
  secrets: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  },
  providerData: {
    payment_method: "cc",
    email_confirmation: "1",
  },
});
```

Notes:
- Ozow hash excludes `CustomerCellphoneNumber`, `Token`, and `GenerateShortUrl`.
- Ozow `AllowVariableAmount=false` is excluded from the hash.
- Payfast signature excludes `setup` and requires uppercase URL encoding.
