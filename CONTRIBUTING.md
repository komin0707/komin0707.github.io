# Contributing

## Local Setup

1. Install the Node version in `.nvmrc`.
2. Run `npm ci`.
3. Run `npm run dev` for local development.

## Verification

Before submitting changes, run:

```bash
npm run type-check
npm run lint
npm run lint:css
npm run format:check
npm test
npm run test:coverage
npm run build
npm run check:no-raster
npm run check:bundle-size
npm run check:performance
```

## Clinical Safety

Keep the educational disclaimer visible. Do not present simulator outputs as clinical recommendations or patient-specific medical advice.
