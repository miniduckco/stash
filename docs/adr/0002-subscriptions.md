# 0002 - Paystack Subscriptions

## Status

Accepted

## Context

Developers want to add recurring billing without learning provider-specific flows. Paystack
supports subscriptions with plan creation and subscription creation APIs, plus webhook events
for invoices and subscription lifecycle updates. We want to add subscription support while
keeping provider leakage minimal and maintaining the existing Stash design principles.

## Decision

We will add first-class subscription capabilities to Stash, starting with Paystack only.
The API will include:

- `subscriptions.plans.create` for Paystack plan creation
- `subscriptions.create` for Paystack subscription creation
- A new `SubscriptionWebhookEvent` model for Paystack subscription and invoice events

`webhooks.parse` will return a union of `WebhookEvent | SubscriptionWebhookEvent` to keep a
single parsing surface while exposing the subscription-specific event data.

Capability metadata will indicate which providers support subscriptions/plans, and Stash
will validate support before making provider calls.

## Consequences

- Paystack subscriptions are supported through a consistent Stash surface.
- `ParsedWebhook.event` becomes a union type, which requires consumers to narrow event types.
- Other providers can add subscription support later without changing the Stash surface.
