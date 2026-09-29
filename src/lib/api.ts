import type {
  HistoryEntry,
  Household,
  InventoryItem,
  Meal,
  MealConfirmation,
  MealConfirmationResult,
  MealState,
  RecommendationResult,
} from '../types'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError('Could not reach Cyber Kitchen. Check your connection and try again.')
  }

  if (!response.ok) {
    let detail: string | undefined
    try {
      const body = (await response.json()) as { detail?: string; message?: string; error?: string }
      detail = body.detail ?? body.message ?? body.error
    } catch {
      // The status-specific fallback below is enough when the response has no JSON body.
    }
    throw new ApiError(detail ?? `Cyber Kitchen returned an error (${response.status}).`, response.status)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('Cyber Kitchen returned an unreadable response.', response.status)
  }
}

type InventoryResponse = { inventory: InventoryItem[] }
type MealsResponse = { meals: Meal[]; selectedMealId: string | null }
type HistoryResponse = { history: HistoryEntry[] }

export async function getMealState(signal?: AbortSignal): Promise<MealState> {
  const [household, inventoryResponse, mealsResponse, historyResponse] = await Promise.all([
    requestJson<Household>('/api/v1/household', { signal }),
    requestJson<InventoryResponse>('/api/v1/inventory', { signal }),
    requestJson<MealsResponse>('/api/v1/meals', { signal }),
    requestJson<HistoryResponse>('/api/v1/history', { signal }),
  ])

  return {
    household,
    inventory: inventoryResponse.inventory,
    meals: mealsResponse.meals,
    history: historyResponse.history,
    selectedMealId: mealsResponse.selectedMealId,
  }
}

export function confirmMeal(mealId: string, confirmation: MealConfirmation) {
  return requestJson<MealConfirmationResult>(`/api/v1/meals/${encodeURIComponent(mealId)}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(confirmation),
  })
}

export function updateHousehold(profile: Pick<Household, 'constraints' | 'goals'>) {
  return requestJson<Household>('/api/v1/household', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
  })
}

export function putInventory(item: InventoryItem) {
  return requestJson<InventoryResponse>(`/api/v1/inventory/${encodeURIComponent(item.id)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
  })
}

export function deleteInventory(id: string) {
  return requestJson<InventoryResponse>(`/api/v1/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function generateRecommendations() {
  return requestJson<RecommendationResult>('/api/v1/recommendations/generate', { method: 'POST' })
}
