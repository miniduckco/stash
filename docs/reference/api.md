# API Reference

## createStash

```ts
createStash(config: StashConfig): {
  payments: { create(input: PaymentCreateInput): Promise<Payment> }
  webhooks: { parse(input: WebhookParseInput): ParsedWebhook }
}
```

Creates a configured Stash client with capability surfaces for payments and webhooks.

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

## webhooks.parse

```ts
webhooks.parse(input: WebhookParseInput): ParsedWebhook
```

Verifies and normalizes provider webhook payloads. Throws `StashError` with `code: "invalid_signature"` on verification failure.

## Payment (canonical)

```ts
type Payment = {
  id: string
  status: "pending" | "paid" | "failed"
  amount: number
  currency: string
  redirectUrl?: string
  provider: "ozow" | "payfast"
  providerRef?: string
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
    provider: "ozow" | "payfast"
    raw: unknown
  }
}
```

## ParsedWebhook

```ts
type ParsedWebhook = {
  event: WebhookEvent
  provider: "ozow" | "payfast"
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
