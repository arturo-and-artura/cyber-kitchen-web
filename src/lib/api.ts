import type { AppState, MealConfirmation } from '../types'

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

async function requestState(path: string, init?: RequestInit): Promise<AppState> {
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
    return (await response.json()) as AppState
  } catch {
    throw new ApiError('Cyber Kitchen returned an unreadable response.', response.status)
  }
}

export function getMealState(signal?: AbortSignal) {
  return requestState('/api/v1/state', { signal })
}

export function confirmMeal(mealId: string, confirmation: MealConfirmation) {
  return requestState(`/api/v1/meals/${encodeURIComponent(mealId)}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(confirmation),
  })
}
