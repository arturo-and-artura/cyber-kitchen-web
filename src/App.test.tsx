import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { inventoryAfterMeal } from './lib/store'
import { initialState, meals } from './test-fixtures'
import type { AppState } from './types'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function confirmedState(note: string): AppState {
  return {
    ...initialState,
    inventory: inventoryAfterMeal(initialState, meals[0]),
    selectedMealId: null,
    history: [
      { id: 'history-new', mealId: meals[0].id, mealName: meals[0].name, emoji: meals[0].emoji, cookedAt: '2026-09-26T18:30:00.000Z', rating: 'loved', note },
      ...initialState.history,
    ],
  }
}

async function reachConfirmation(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: /good morning/i })
  await user.click(screen.getByRole('button', { name: /choose tonight’s meal/i }))
  await user.click(screen.getAllByRole('button', { name: /cook this meal/i })[0])
  for (let index = 0; index < 4; index += 1) await user.click(screen.getByRole('button', { name: /next step/i }))
  await user.click(screen.getByRole('button', { name: /finish cooking/i }))
}

afterEach(() => vi.unstubAllGlobals())

describe('Cyber Kitchen API flow', () => {
  it('loads recommendations and confirms a meal through the API', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(initialState))
      .mockResolvedValueOnce(jsonResponse(confirmedState('Bright and easy.')))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/getting your kitchen ready/i)
    expect(await screen.findByText('✓ Peanut-free')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/state', expect.objectContaining({ signal: expect.any(AbortSignal) }))

    await reachConfirmation(user)
    expect(screen.getByRole('heading', { name: /nice work/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing changes until you confirm/i)).toBeInTheDocument()
    expect(screen.getByText('2 fillets')).toBeInTheDocument()
    expect(screen.getByText('0 fillets')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/everyone loved/i), 'Bright and easy.')
    await user.click(screen.getByRole('button', { name: /confirm meal & update inventory/i }))

    expect(await screen.findByText('Dinner is done!')).toBeInTheDocument()
    expect(screen.getByText(/miso-glazed salmon bowls was added/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/meals/miso-salmon/confirm', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ rating: 'loved', note: 'Bright and easy.' }),
    }))

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    await user.click(within(nav).getByRole('button', { name: 'Inventory' }))
    expect(screen.getByRole('heading', { name: 'Salmon fillets' }).closest('article')).toHaveTextContent('0 fillets')
    await user.click(within(nav).getByRole('button', { name: 'History' }))
    expect(screen.getByText('“Bright and easy.”')).toBeInTheDocument()
  })

  it('shows an initial-load error and retries the state request', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse(initialState))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach cyber kitchen/i)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: /good morning/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the confirmation preview intact when confirmation fails and allows retry', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(initialState))
      .mockResolvedValueOnce(jsonResponse({ detail: 'Temporary kitchen outage' }, 503))
      .mockResolvedValueOnce(jsonResponse(confirmedState('Try again note.')))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<App />)
    await reachConfirmation(user)
    await user.type(screen.getByPlaceholderText(/everyone loved/i), 'Try again note.')
    await user.click(screen.getByRole('button', { name: /confirm meal & update inventory/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Temporary kitchen outage')
    expect(screen.getByText(/nothing changes until you confirm/i)).toBeInTheDocument()
    expect(screen.getByText('2 fillets')).toBeInTheDocument()
    expect(screen.getByText('0 fillets')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /confirm meal & update inventory/i }))
    await waitFor(() => expect(screen.getByText('Dinner is done!')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
