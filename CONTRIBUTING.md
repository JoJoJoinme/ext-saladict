# Contributing to Saladict

## Read First

- [Current architecture](./docs/architecture.md)
- [MV3 migration status](./MV3_MIGRATION.md)
- [User-intent acceptance tests](./docs/user-intent-acceptance.md)

## Setup

```bash
git clone git@github.com:crimx/ext-saladict.git
cd ext-saladict
npm install
cp .env.example .env
```

If you do not use dictionary credentials, `.env` can stay empty.

## Daily Commands

```bash
npm run dev
npm run build
npm test
npm run test:acceptance
npm run test:e2e
npm run test:e2e:playwright
npm run test:required
```

## Required Gate

For any user-visible change:

1. Identify the affected user journey.
2. Update [`test/acceptance/spec.json`](./test/acceptance/spec.json) if coverage does not already exist.
3. Keep the acceptance contract stable unless the contract itself is intentionally changing.
4. Run `npm run test:required`.

If the change touches shared infrastructure, background logic, sync, or dictionary engines, also run:

```bash
npm test
```

## MV3 Guardrails

- Background logic runs in a service worker. Do not introduce new `window.*` state there. Use [`src/background/state.ts`](./src/background/state.ts).
- DOM work is not allowed in the background. Route it through [`src/background/offscreen-helper.ts`](./src/background/offscreen-helper.ts).
- New extension pages must be added under [`src/entrypoints/`](./src/entrypoints/) using `name/index.html` and `name/main.tsx`.
- Permission or manifest changes must be made in [`wxt.config.ts`](./wxt.config.ts) and covered by E2E tests.
- Do not remove acceptance contract attributes such as `lookup-panel` or `data-lookup-terminal` without updating the tests and docs together.

## Adding a Dictionary

1. Add the dictionary under [`src/components/dictionaries/`](./src/components/dictionaries/).
2. Register it in app config and locales.
3. Implement `getSrcPage` and `search`.
4. Add parser/engine tests under [`test/specs/components/dictionaries/`](./test/specs/components/dictionaries/).
5. If the user journey changes, add or update acceptance scenarios as well.

## Commit Style

Use conventional commits. `npm run commit` is available if you want the interactive helper.
