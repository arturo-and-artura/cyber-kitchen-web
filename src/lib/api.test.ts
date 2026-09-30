import { afterEach, describe, expect, it, vi } from 'vitest'
import { initialState } from '../test-fixtures'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function resourceResponse(path: string) {
  if (path.endsWith('/household')) return jsonResponse(initialState.household)
  if (path.endsWith('/inventory')) return jsonResponse({ inventory: initialState.inventory })
  if (path.endsWith('/meals')) return jsonResponse({ meals: initialState.meals, selectedMealId: initialState.selectedMealId })
  if (path.endsWith('/history')) return jsonResponse({ history: initialState.history })
  throw new Error(`Unexpected request: ${path}`)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('meal state API client', () => {
  it('loads all read resources concurrently and assembles MealState', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const pendingResolvers: Array<() => void> = []
    const fetchMock = vi.fn((input: string | URL | Request) => new Promise<Response>((resolve) => {
      const path = String(input)
      pendingResolvers.push(() => resolve(resourceResponse(path)))
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { getMealState } = await import('./api')

    const statePromise = getMealState()

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/v1/household',
      '/api/v1/inventory',
      '/api/v1/meals',
      '/api/v1/history',
    ])
    pendingResolvers.forEach((resolve) => resolve())
    await expect(statePromise).resolves.toEqual(initialState)
  })

  it.each([
    ['/api/v1/household', 'household unavailable'],
    ['/api/v1/inventory', 'inventory unavailable'],
    ['/api/v1/meals', 'meals unavailable'],
    ['/api/v1/history', 'history unavailable'],
  ])('surfaces a failure from %s', async (failedPath, message) => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const path = String(input)
      return Promise.resolve(path === failedPath
        ? jsonResponse({ error: message }, 503)
        : resourceResponse(path))
    })
    vi.stubGlobal('fetch', fetchMock)
    const { getMealState } = await import('./api')

    await expect(getMealState()).rejects.toThrow(message)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('uses the configured API base URL and decodes the confirmation result', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
    const confirmationResult = {
      inventory: initialState.inventory.slice(1),
      history: initialState.history,
      selectedMealId: null,
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(confirmationResult))
    vi.stubGlobal('fetch', fetchMock)
    const { confirmMeal } = await import('./api')

    await expect(confirmMeal('meal/one', { rating: 'okay', note: '' })).resolves.toEqual(confirmationResult)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/meals/meal%2Fone/confirm',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('surfaces the backend error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: 'meal not found' }, 404))
    vi.stubGlobal('fetch', fetchMock)
    const { confirmMeal } = await import('./api')

    await expect(confirmMeal('missing', { rating: 'okay', note: '' })).rejects.toThrow('meal not found')
  })

  it('updates every editable household field without sending the read-only name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(initialState.household))
    vi.stubGlobal('fetch', fetchMock)
    const { updateHousehold } = await import('./api')
    const update = {
      members: initialState.household.members,
      constraints: initialState.household.constraints,
      goals: initialState.household.goals,
      preferences: initialState.household.preferences,
    }

    await updateHousehold(update)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/household', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(update),
    }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).not.toHaveProperty('name')
  })
})
