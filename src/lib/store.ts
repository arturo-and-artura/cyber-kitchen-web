import type { AppState, Meal } from '../types'

export function inventoryAfterMeal(state: AppState, meal: Meal) {
  return state.inventory.map((item) => {
    const used = meal.ingredients.find((ingredient) => ingredient.inventoryId === item.id)?.amount ?? 0
    return { ...item, amount: Math.max(0, item.amount - used) }
  })
}

export function formatAmount(amount: number, unit: string) {
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}${unit ? ` ${unit}` : ''}`
}
