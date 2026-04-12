# Saladict

Saladict is a Chrome/Edge Manifest V3 extension for inline dictionary lookup and translation on selected text.

## Status

- MV2 -> MV3 migration is complete for the Chrome/Edge runtime.
- Build system: WXT + Vite.
- Firefox/Safari manifests are no longer maintained in this branch.
- Main user flows are protected by Jest, user-intent acceptance, Playwright E2E, and Puppeteer E2E.

See:

- [Current architecture](./docs/architecture.md)
- [MV3 migration status](./MV3_MIGRATION.md)
- [User-intent acceptance tests](./docs/user-intent-acceptance.md)
- [Contributing guide](./CONTRIBUTING.md)

## Build From Source

```bash
git clone git@github.com:crimx/ext-saladict.git
cd ext-saladict
npm install
cp .env.example .env
npm run build
```

If you do not use dictionary credentials, `.env` can stay empty.

Build artifacts are generated in `dist/chrome-mv3/`.

## Development

```bash
npm run dev
```

## Tests

```bash
npm test
npm run test:acceptance
npm run test:e2e
npm run test:e2e:playwright
npm run test:required
```

`npm run test:required` is the merge gate for user-visible changes:

1. lookup acceptance contract unit tests
2. user-intent acceptance tests
3. Playwright real-extension E2E

## License

[MIT](./LICENSE)
