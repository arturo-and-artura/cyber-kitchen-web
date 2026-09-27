# Cyber Kitchen Web repository guide

## Working instructions

- Read [the documentation index](.aidoc/INDEX.md) and [MVP product flow](.aidoc/product/mvp-flow.md) before changing screens, navigation, household constraints, persisted state, inventory behavior, recommendations, or backend integration.
- Treat the product-flow document as canonical for product intent, interaction states, persistence boundaries, and user-visible invariants. Update it when those behaviors change.
- Keep backend contracts behind typed client boundaries when API integration begins.
- Preserve semantic structure, labels, keyboard focus, sufficient contrast, non-color status cues, and reduced-motion behavior.
- Validate both compact mobile and desktop layouts when changing a screen.

## Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Definition of done

Changes must keep the primary product loop runnable, update the canonical product documentation when behavior changes, and pass test, typecheck, lint, and build. For meaningful UI changes, inspect the app at desktop and mobile widths.

## Delivery policy

Work on feature branches and open a PR to the protected default branch. Do not deploy, change production data, add a real external service, or introduce credentials without explicit approval.
