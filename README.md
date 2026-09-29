# Cyber Kitchen Web

Cyber Kitchen Web is the browser interface for a focused household kitchen-assistance agent. People keep household guidance and inventory current, request explained meal ideas, cook step by step, and explicitly confirm every inventory/history mutation.

## Run

```bash
npm install
npm run dev
```

The client calls the API on the same origin by default. Set `VITE_API_BASE_URL` when the backend runs separately:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

## Product flow

The primary interaction is **Today → Choose → Cook → Confirm → Today**. Inventory & profile editing and History remain available in the main navigation. Refreshing meal ideas performs one focused kitchen-agent turn; the UI reports when deterministic fallback ideas are used. Confirmation previews inventory changes and commits them only after the person explicitly approves.

See [MVP product flow](.aidoc/product/mvp-flow.md) for detailed state, safety, and API boundaries.

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Documentation

- [MVP product flow](.aidoc/product/mvp-flow.md)
- [Documentation index](.aidoc/INDEX.md)
- [Repository guide](AGENT.md)
