# Cyber Kitchen Web

Cyber Kitchen Web helps a household choose a meal, cook it, record feedback, and keep inventory synchronized. The client loads household state and recommendations from the Cyber Kitchen API and sends confirmed meal feedback back to that API.

## Run

```bash
npm install
npm run dev
```

The client calls the API on the same origin by default. Set `VITE_API_BASE_URL` to an origin such as `http://localhost:8000` when the backend runs separately:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

For the established test-site preview, run the backend on `127.0.0.1:8080`, build the client, and start `npm run preview`. The preview server listens on port `4174` and proxies same-origin `/api` requests to the backend, so the browser does not need a deployment-specific API URL.

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Product flow

The primary interaction is **Today → Choose → Cook → Confirm → Today**. Inventory and History remain available from the main navigation. Meal confirmation previews inventory changes locally, then uses the API response as the authoritative committed state.

## Documentation

- [MVP product flow](.aidoc/product/mvp-flow.md) — product intent, API boundary, interaction states, and confirmation invariants
- [Documentation index](.aidoc/INDEX.md) — canonical reading paths
- [Repository guide](AGENT.md) — implementation, accessibility, and delivery rules
