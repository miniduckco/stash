# Changelog

## Unreleased

- Standardize provider validation failures with StashError codes/messages.

## 0.1.3

- Convert Paystack amounts from major to minor by default and add an amountUnit override.

## 0.1.2

- Add canonical structured logging with correlation IDs for payment actions.

## 0.1.1

- Add SvelteKit site under `site/` with brand palette and typography.
- Build a landing page and docs hub that render markdown from `docs/`.
- Add Dockerfile for local preview on port 5173.
- Fix docs links to point to docs routes and GitHub examples.
- Update package scope to `@miniduckco/stash` and refresh description.
- Fix test runner invocation in CI to avoid glob expansion issues.

- Add `createStash` with capability surfaces for payments and webhooks.
- Return canonical `Payment` and `WebhookEvent` models.
- Add providerOptions typing and overlap validation.
- Update docs and examples to the new API.
- Add Paystack provider support for card checkout, webhooks, and verification.

## 0.1.0

- Add unified `makePayment` for Ozow and Payfast.
- Implement webhook signature verification for both providers.
- Add Diataxis docs and runnable examples.
