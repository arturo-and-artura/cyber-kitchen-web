---
domain: Designs
status: Active
entry_points:
  - src/App.tsx
dependencies:
  - product/mvp-flow.md
---

# Cyber Kitchen Web documentation

This index is the canonical entry point for product and implementation documentation for the web client. Read the MVP product flow before changing navigation, household constraints, API state, confirmation behavior, or inventory updates.

## Documentation map

| Document | Purpose |
|----------|---------|
| [MVP product flow](product/mvp-flow.md) | Defines product intent, interaction states, persistence behavior, and user-visible invariants. |
| [Repository guide](../AGENT.md) | Defines active implementation, accessibility, and delivery instructions. |
| [README](../README.md) | Summarizes the product and local development commands. |

## Reading chains

- **Change a product screen or transition:** [MVP product flow](product/mvp-flow.md) → `src/App.tsx` → relevant component in `src/components`
- **Change API state or confirmation behavior:** [MVP product flow](product/mvp-flow.md) → `src/types.ts` → `src/lib/api.ts` → `src/App.tsx`
- **Change inventory preview behavior:** [MVP product flow](product/mvp-flow.md) → `src/types.ts` → `src/lib/store.ts`
