# API Reference

## createStash

```ts
createStash(config: StashConfig): {
  payments: { create(input: PaymentCreateInput): Promise<Payment> }
  webhooks: { parse(input: WebhookParseInput): ParsedWebhook }
}
```

Creates a configured Stash client with capability surfaces for payments and webhooks.

### Test mode

`testMode: true` routes requests to provider sandbox endpoints. Set it to `false` for live production traffic.

### Structured logging

Stash can emit canonical, structured log events for each payment action. Provide a logger when you create the client:

```ts
const stash = createStash({
  provider: "payfast",
  credentials: {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  },
  testMode: true,
  logger: {
    log: (event) => {
      // Send to your logging pipeline
      console.log(event);
    },
  },
});
```

Each event includes a `correlation_id`, `event` name (for example, `payments.create.request`), and safe metadata such as
amount, currency, and reference. Stash never logs credentials or raw webhook payloads.

## payments.create

```ts
payments.create(input: PaymentCreateInput): Promise<Payment>
```

Creates a payment using the configured provider and returns a canonical `Payment`.

### providerOptions mapping

Payfast
- `paymentMethod` → `payment_method`
- `emailConfirmation` → `email_confirmation`
- `confirmationAddress` → `confirmation_address`
- `mPaymentId` → `m_payment_id`
- `itemName` → `item_name`
- `itemDescription` → `item_description`

Ozow
- `selectedBankId` → `SelectedBankId`
- `customerIdentityNumber` → `CustomerIdentityNumber`
- `allowVariableAmount` → `AllowVariableAmount`
- `variableAmountMin` → `VariableAmountMin`
- `variableAmountMax` → `VariableAmountMax`

Paystack
- `channels` → `channels`

### Amounts

Amounts are treated as major units by default (for example, "25.00"). For Paystack,
Stash converts major units to minor units automatically. To send minor units explicitly,
set `amountUnit: "minor"` in `payments.create`.

## webhooks.parse

```ts
webhooks.parse(input: WebhookParseInput): ParsedWebhook
```

Verifies and normalizes provider webhook payloads. Throws `StashError` with `code: "invalid_signature"` on verification failure.

## payments.verify

```ts
payments.verify(input: PaymentVerifyInput): Promise<VerificationResult>
```

Verifies payment status by reference. Supported providers:

- Ozow ✅
- Paystack ✅
- Payfast ❌ (`unsupported_capability`)

## providerCapabilities

```ts
providerCapabilities: Record<PaymentProvider, ProviderCapabilities>
```

Static metadata describing provider capabilities for validation and docs.

| Provider | Currencies | Required fields | payments.verify |
| --- | --- | --- | --- |
| Ozow | ZAR | - | ✅ |
| Payfast | ZAR | - | ❌ |
| Paystack | Any | customer.email | ✅ |

## VerificationResult

```ts
type VerificationResult = {
  provider: "ozow" | "payfast" | "paystack"
  status: "pending" | "paid" | "failed" | "unknown"
  providerRef?: string
  correlationId?: string
  raw?: unknown
}
```

## Payment (canonical)

```ts
type Payment = {
  id: string
  status: "pending" | "paid" | "failed"
  amount: number
  currency: string
  redirectUrl?: string
  provider: "ozow" | "payfast" | "paystack"
  providerRef?: string
  correlationId?: string
  raw?: unknown
}
```

## WebhookEvent (canonical)

```ts
type WebhookEvent = {
  type: "payment.completed" | "payment.failed" | "payment.cancelled"
  data: {
    id?: string
    providerRef?: string
    reference: string
    amount?: number
    currency?: string
    provider: "ozow" | "payfast" | "paystack"
    raw: unknown
  }
}
```

## ParsedWebhook

```ts
type ParsedWebhook = {
  event: WebhookEvent
  provider: "ozow" | "payfast" | "paystack"
  correlationId?: string
  raw: Record<string, unknown>
}
```

## makePayment (deprecated)

```ts
makePayment(input: PaymentRequest): Promise<PaymentResponse>
```

Creates a payment request for Ozow or Payfast using a unified payload.

Deprecated: use `createStash().payments.create`.

## verifyWebhookSignature (deprecated)

```ts
verifyWebhookSignature(input: WebhookVerifyInput): WebhookVerifyResult
```

Verifies the provider webhook signature for Ozow or Payfast.

Deprecated: use `createStash().webhooks.parse`.

## Webhook utilities

```ts
buildFormEncoded(payload: Record<string, string | number | boolean | null | undefined>): string
parseFormBody(rawBody: string | Buffer): [string, string][]
parseFormEncoded(raw: string): [string, string][]
pairsToRecord(pairs: [string, string][]): Record<string, string>
```
