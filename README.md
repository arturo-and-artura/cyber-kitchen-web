# Cyber Kitchen Web

Cyber Kitchen Web helps a household choose a meal, cook it, record feedback, and keep inventory synchronized. The current client uses local fixtures and browser storage; it makes no backend or live AI requests.

## Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Product flow

The primary interaction is **Today → Choose → Cook → Confirm → Today**. Inventory and History remain available from the main navigation. Meal confirmation previews inventory changes before committing them and records feedback for future product behavior.

## Documentation

- [MVP product flow](.aidoc/product/mvp-flow.md) — product intent, interaction states, and persistence invariants
- [Documentation index](.aidoc/INDEX.md) — canonical reading paths
- [Repository guide](AGENT.md) — implementation, accessibility, and delivery rules
