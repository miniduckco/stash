# Architecture

## Unified payloads

The SDK exposes a single payload shape for payments, regardless of provider. Provider adapters map that shape to each provider's required fields and signing rules.

## Provider adapters

Each provider lives in its own module with minimal shared helpers. This keeps provider logic isolated and makes it easy to add or swap providers without changing the public API.

## Webhook verification

Webhook verification is provider-specific, but the SDK keeps the call site consistent with `verifyWebhookSignature`. Payfast also exposes a hardening helper to match their recommended verification flow.
