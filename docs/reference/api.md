# API Reference

## makePayment

```ts
makePayment(input: PaymentRequest): Promise<PaymentResponse>
```

Creates a payment request for Ozow or Payfast using a unified payload.

## verifyWebhookSignature

```ts
verifyWebhookSignature(input: WebhookVerifyInput): WebhookVerifyResult
```

Verifies the provider webhook signature for Ozow or Payfast.

## validatePayfastWebhookSignature

```ts
validatePayfastWebhookSignature(
  input: PayfastWebhookValidationInput
): Promise<PayfastWebhookValidationResult>
```

Validates Payfast ITNs with optional server confirmation and IP checks.

## getOzowTransactionStatusByReference

```ts
getOzowTransactionStatusByReference(
  input: OzowTransactionQuery
): Promise<OzowTransactionResult>
```

Queries Ozow by merchant reference.

## getOzowTransactionStatus

```ts
getOzowTransactionStatus(
  input: OzowTransactionQuery
): Promise<OzowTransactionResult>
```

Queries Ozow by Ozow transaction ID.

## Webhook utilities

```ts
buildFormEncoded(payload: Record<string, string | number | boolean | null | undefined>): string
parseFormBody(rawBody: string | Buffer): [string, string][]
parseFormEncoded(raw: string): [string, string][]
pairsToRecord(pairs: [string, string][]): Record<string, string>
```
