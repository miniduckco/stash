# ADR 0001: Reduce provider leakage with canonical normalization

## Status

Accepted

## Date

2026-02-24

## Decision Makers

- Obakeng Mosadi

## Context

Stash unifies multiple South African payment providers behind a single SDK. Provider-specific
quirks still leak into the developer experience (for example, Paystack minor units, ZAR-only
constraints in Ozow and Payfast, and required fields like Paystack customer email). These
quirks increase integration friction and create inconsistent behavior across providers.

We want a predictable, consistent SDK contract while still enforcing provider constraints
accurately. This decision should avoid overengineering and keep the SDK surface small.

## Decision Drivers

- Reduce provider-specific knowledge required by developers.
- Preserve correctness with provider constraints and required fields.
- Provide actionable, consistent error handling.
- Keep the SDK surface compact and maintainable.

## Considered Options

1. Keep provider-specific behavior and document quirks.
2. Canonical normalization with explicit, structured errors.
3. Provider-specific client surfaces or opt-in wrappers.
4. Automatic conversion of all provider quirks.

## Decision

Adopt canonical normalization and explicit errors as the default strategy:

- Amounts are treated as major units by default. Paystack converts to minor units internally,
  with `amountUnit: "minor"` available for explicit minor-unit inputs.
- Currency is normalized to uppercase. ZAR remains the default when omitted.
- Provider constraints (for example, ZAR-only providers) are enforced consistently.
- Required fields (for example, Paystack `customer.email`) are validated and reported via
  `StashError` with actionable messages.

## Consequences

### Positive

- Consistent behavior across providers, fewer surprises for developers.
- Actionable errors reduce integration time and support overhead.
- Canonical data makes downstream handling and logging more reliable.

### Negative

- Some existing integrations may need to adjust for new defaults or validation.
- Requires ongoing diligence to keep normalization aligned with provider changes.
- Not all quirks can be abstracted; some provider-specific exceptions remain.

## Follow-ups

- Provide provider capability metadata (supported currencies, verify support, required fields).
- Expand webhook normalization for more consistent events and statuses.
- Explore type-level ergonomics for provider-specific required fields.

## Confidence

Medium-high. This decision is validated by recent Paystack amount and currency changes and
aligns with the SDK’s goal of reducing integration friction.
