import { afterEach, describe, expect, it, vi } from 'vitest'
import { initialState } from '../test-fixtures'

function response() {
  return new Response(JSON.stringify(initialState), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('meal state API client', () => {
  it('uses same-origin API paths by default', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const fetchMock = vi.fn().mockResolvedValue(response())
    vi.stubGlobal('fetch', fetchMock)
    const { getMealState } = await import('./api')

    await expect(getMealState()).resolves.toEqual(initialState)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/state', expect.any(Object))
  })

  it('uses the configured API base URL without a duplicate slash', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
    const fetchMock = vi.fn().mockResolvedValue(response())
    vi.stubGlobal('fetch', fetchMock)
    const { confirmMeal } = await import('./api')

    await confirmMeal('meal/one', { rating: 'okay', note: '' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/meals/meal%2Fone/confirm',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('surfaces the backend error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'meal not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { confirmMeal } = await import('./api')

    await expect(confirmMeal('missing', { rating: 'okay', note: '' })).rejects.toThrow('meal not found')
  })
})
