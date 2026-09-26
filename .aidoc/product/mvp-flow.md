---
domain: Designs
status: Active
entry_points:
  - src/App.tsx
  - src/lib/store.ts
  - src/data/mockData.ts
dependencies:
  - ../INDEX.md
---

# MVP product flow

Cyber Kitchen helps a household decide what to cook, follow the recipe, record feedback, and update inventory without hiding consequential changes. The current client demonstrates this loop with local fixtures and browser persistence; recommendations do not use a backend or live AI service.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Documentation index](../INDEX.md) | Canonical documentation entry point |
| [Repository guide](../../AGENT.md) | Active implementation and accessibility rules |

## Why the Flow Exists

Meal decisions combine safety constraints, available ingredients, household goals, time, and prior preferences. The product presents a small set of explained choices so people can understand why each meal fits instead of treating a recommendation as an opaque answer.

Cooking changes inventory and creates household history. The confirmation step keeps those changes visible and reversible until the person explicitly commits them.

## What the Product Does

The primary flow is **Today → Choose → Cook → Confirm → Today**:

1. **Today** presents household constraints, inventory signals, and the next action.
2. **Choose** presents three meal options with time, difficulty, rationale, goal tags, and a cooking action.
3. **Cook** presents required ingredients and one emphasized instruction at a time.
4. **Confirm** collects a rating and optional note, previews every inventory adjustment, and commits only after confirmation.
5. **Today** reports completion while Inventory and History reflect the committed result.

The main navigation exposes Today, Inventory, and History throughout the experience. The cooking states remain grouped under Today so navigation communicates that they belong to one task.

## Product Invariants

- Recommendation rationale MUST remain visible and distinguish the fixture-based experience from a live AI service.
- Household allergy constraints MUST remain visible at meal-selection decision points.
- Meal confirmation MUST preview inventory changes before committing them.
- Preview and commit MUST use the same deterministic inventory calculation.
- Inventory quantities MUST NOT fall below zero.
- Returning from confirmation to the recipe MUST preserve the selected meal and avoid inventory or history mutations.
- Confirming a meal MUST update inventory, prepend a history entry, clear the selected meal, and return to Today.
- Invalid persisted meal selections MUST fall back to Today safely.

## Persistence and Data Boundaries

`App` owns the current view and persisted `AppState`. View position, ingredient checklist progress, and current cooking step are intentionally transient; inventory, meal history, and selected meal identity persist under the versioned key exported by `src/lib/store.ts`.

`loadState` restores persisted state and falls back to `initialState` when stored JSON cannot be read. `inventoryAfterMeal` calculates both the confirmation preview and the committed inventory so the displayed outcome cannot drift from the saved outcome.

Current recommendations and initial household data are fixtures in `src/data/mockData.ts`. No product data leaves the browser, and the client has no authentication, telemetry, backend request, or external recommendation integration.

## Interaction and Accessibility Constraints

`Shell` provides the persistent desktop navigation and compact mobile navigation. Screen components preserve semantic headings, labels, keyboard focus, non-color status cues, and reduced-motion behavior.

`ConfirmMeal` requires one of the supported ratings, accepts an optional bounded note, and exposes the before-and-after quantity for each used ingredient. `Inventory` provides case-insensitive search, category filters, low-stock labels, and an explicit empty state. `History` presents newest entries first and summarizes positive feedback.

## Code Pointers

| Concern | Primary implementation |
|---------|------------------------|
| View transitions and confirmation commit | `App` in `src/App.tsx` |
| Persisted state and inventory calculation | `loadState` and `inventoryAfterMeal` in `src/lib/store.ts` |
| Domain-shaped client types | `src/types.ts` |
| Recommendation and initial-state fixtures | `src/data/mockData.ts` |
| Navigation and task grouping | `Shell` in `src/components/Shell.tsx` |
| Confirmation preview and feedback | `ConfirmMeal` in `src/components/ConfirmMeal.tsx` |
