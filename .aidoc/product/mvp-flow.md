---
domain: Designs
status: Active
entry_points:
  - src/App.tsx
  - src/lib/api.ts
  - src/lib/store.ts
dependencies:
  - ../INDEX.md
---

# MVP product flow

Cyber Kitchen helps a household decide what to cook, follow the recipe, record feedback, and update inventory without hiding consequential changes. The web client assembles household state and recommendations from resource-oriented Cyber Kitchen API reads, then adopts the committed fields returned after confirmation.

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

- Recommendation rationale MUST remain visible at meal-selection decision points.
- Household allergy constraints MUST remain visible at meal-selection decision points.
- Meal confirmation MUST preview inventory changes before committing them.
- Preview and commit MUST use the same deterministic inventory calculation.
- Inventory quantities MUST NOT fall below zero.
- Returning from confirmation to the recipe MUST preserve the selected meal and avoid inventory or history mutations.
- Confirming a meal MUST send the selected meal, rating, and note to the API; only a successful response may update inventory and history, clear the selected meal, and return to Today.
- A failed confirmation MUST preserve the selected meal, feedback, preview, inventory, and history so the person can retry.
- Invalid selected meal identifiers returned by the API MUST fall back to Today safely.

## Persistence and Data Boundaries

`App` owns transient view position, active cooking stage, ingredient checklist progress, current cooking step, and confirmation feedback. These values survive navigation to Today, Inventory, or History during the browser session, and Today offers an explicit resume action. Selecting a different meal or successfully confirming the active meal clears the prior task state. This interruption safety is intentionally session-only; the client does not mirror domain state into browser storage.

`getMealState` in `src/lib/api.ts` concurrently requests `GET /api/v1/household`, `GET /api/v1/inventory`, `GET /api/v1/meals`, and `GET /api/v1/history`, then assembles their typed payloads into `MealState`. There is no aggregate-state fallback. The initial view remains loading until all four resources succeed. A failure from any resource keeps the error visible and retries the complete read set. The API is the persistence boundary.

Meal selection remains local during the cooking flow. `confirmMeal` sends `{ rating, note }` to `POST /api/v1/meals/{mealId}/confirm`. After a successful response, `App` preserves the existing household and meal recommendations while replacing inventory, history, and selected meal identity with the returned authoritative fields. `VITE_API_BASE_URL` configures a separate API origin and defaults to same-origin requests.

`inventoryAfterMeal` in `src/lib/store.ts` deterministically calculates the confirmation preview and clamps quantities at zero. The backend independently commits the operation and returns authoritative inventory and history, so the client never presents a failed request as committed. Initial-load and confirmation failures remain visible and retryable.

## Interaction and Accessibility Constraints

`Shell` provides the persistent desktop navigation and compact mobile navigation. Both navigation variants expose the active page semantically. Screen components preserve semantic headings, labels, keyboard focus, non-color status cues, and reduced-motion behavior. Today derives its date and time-of-day greeting from the browser rather than presenting fixture copy.

`ConfirmMeal` requires one of the supported ratings, accepts an optional bounded note, and exposes the before-and-after quantity for each used ingredient. `Inventory` provides case-insensitive search, category filters, low-stock labels, and an explicit empty state. `History` presents newest entries first and summarizes positive feedback.

## Code Pointers

| Concern | Primary implementation |
|---------|------------------------|
| View transitions and API state adoption | `App` in `src/App.tsx` |
| Backend requests and base URL configuration | `getMealState` and `confirmMeal` in `src/lib/api.ts` |
| Confirmation inventory preview | `inventoryAfterMeal` in `src/lib/store.ts` |
| Assembled `MealState` and API boundary types | `src/types.ts` |
| Navigation and task grouping | `Shell` in `src/components/Shell.tsx` |
| Confirmation preview and feedback | `ConfirmMeal` in `src/components/ConfirmMeal.tsx` |
