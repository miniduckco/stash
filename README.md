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

## Examples

Runnable examples live in `examples/`:

- Index: `examples/README.md`

Notes:
- Ozow hash excludes `CustomerCellphoneNumber`, `Token`, and `GenerateShortUrl`.
- Ozow `AllowVariableAmount=false` is excluded from the hash.
- Payfast signature excludes `setup` and requires uppercase URL encoding.
