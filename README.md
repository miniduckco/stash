# @miniduck/stash

Integrate payments in under 15 minutes.

## Install

```bash
npm install @miniduck/stash
```

## Getting started

Start with the quickstart tutorial: `docs/tutorials/quickstart.md`.

## Docs (Diataxis)

- Tutorials: `docs/tutorials/quickstart.md`
- How-to guides: `docs/how-to/README.md`
- Reference: `docs/reference/api.md`
- Explanation: `docs/explanation/architecture.md`
- Skills quick reference: `doc/skill.md`

## Examples

Runnable examples live in `examples/`:

- Index: `examples/README.md`

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

Notes:
- Ozow hash excludes `CustomerCellphoneNumber`, `Token`, and `GenerateShortUrl`.
- Ozow `AllowVariableAmount=false` is excluded from the hash.
- Payfast signature excludes `setup` and requires uppercase URL encoding.
