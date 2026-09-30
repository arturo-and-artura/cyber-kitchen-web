import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { inventoryAfterMeal } from './lib/store'
import { initialState, meals } from './test-fixtures'
import type { MealConfirmationResult } from './types'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function readResourceResponse(path: string) {
  if (path === '/api/v1/household') return jsonResponse(initialState.household)
  if (path === '/api/v1/inventory') return jsonResponse({ inventory: initialState.inventory })
  if (path === '/api/v1/meals') return jsonResponse({ meals: initialState.meals, selectedMealId: initialState.selectedMealId })
  if (path === '/api/v1/history') return jsonResponse({ history: initialState.history })
  throw new Error(`Unexpected request: ${path}`)
}

function confirmedResult(note: string): MealConfirmationResult {
  return {
    inventory: inventoryAfterMeal(initialState, meals[0]),
    selectedMealId: null,
    history: [
      { id: 'history-new', mealId: meals[0].id, mealName: meals[0].name, emoji: meals[0].emoji, cookedAt: '2026-09-26T18:30:00.000Z', rating: 'loved', note },
      ...initialState.history,
    ],
  }
}

async function reachConfirmation(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: /good (morning|afternoon|evening)/i })
  await user.click(screen.getByRole('button', { name: /choose tonight’s meal/i }))
  await user.click(screen.getAllByRole('button', { name: /cook this meal/i })[0])
  for (let index = 0; index < 4; index += 1) await user.click(screen.getByRole('button', { name: /next step/i }))
  await user.click(screen.getByRole('button', { name: /finish cooking/i }))
}

afterEach(() => vi.unstubAllGlobals())

describe('Cyber Kitchen API flow', () => {
  it('assembles resource reads and adopts only returned confirmation fields', async () => {
    const result = confirmedResult('Bright and easy.')
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const path = String(input)
      return Promise.resolve(path.endsWith('/confirm') ? jsonResponse(result) : readResourceResponse(path))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(/getting your kitchen ready/i)
    expect(await screen.findByText('✓ Keep ingredients separate')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(4)
    for (const path of ['/api/v1/household', '/api/v1/inventory', '/api/v1/meals', '/api/v1/history']) {
      expect(fetchMock).toHaveBeenCalledWith(path, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    }

    await reachConfirmation(user)
    expect(screen.getByRole('heading', { name: /nice work/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing changes until you confirm/i)).toBeInTheDocument()
    expect(screen.getByText('2 fillets')).toBeInTheDocument()
    expect(screen.getByText('0 fillets')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/everyone loved/i), 'Bright and easy.')
    await user.click(screen.getByRole('button', { name: /confirm meal & update inventory/i }))

    expect(await screen.findByText('Dinner is done!')).toBeInTheDocument()
    expect(screen.getByText(/miso-glazed salmon bowls was added/i)).toBeInTheDocument()
    expect(screen.getByText('✓ Keep ingredients separate')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/meals/miso-salmon/confirm', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ rating: 'loved', note: 'Bright and easy.' }),
    }))

    await user.click(screen.getByRole('button', { name: /choose tonight’s meal/i }))
    expect(screen.getByRole('heading', { name: meals[0].name })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    await user.click(within(nav).getByRole('button', { name: 'Inventory' }))
    expect(screen.getByRole('heading', { name: 'Salmon fillets' }).closest('article')).toHaveTextContent('0 fillets')
    await user.click(within(nav).getByRole('button', { name: 'History' }))
    expect(screen.getByText('“Bright and easy.”')).toBeInTheDocument()
  })

  it('shows a per-resource initial-load error and retries all resource reads', async () => {
    let householdAttempts = 0
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const path = String(input)
      if (path === '/api/v1/household' && householdAttempts++ === 0) {
        return Promise.reject(new TypeError('offline'))
      }
      return Promise.resolve(readResourceResponse(path))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach cyber kitchen/i)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(8)
  })

  it('keeps the confirmation preview intact when confirmation fails and allows retry', async () => {
    let confirmationAttempts = 0
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const path = String(input)
      if (!path.endsWith('/confirm')) return Promise.resolve(readResourceResponse(path))
      confirmationAttempts += 1
      return Promise.resolve(confirmationAttempts === 1
        ? jsonResponse({ detail: 'Temporary kitchen outage' }, 503)
        : jsonResponse(confirmedResult('Try again note.')))
    })
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
    expect(confirmationAttempts).toBe(2)
  })

  it('preserves the ingredient checklist and recipe step across navigation', async () => {
    vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => Promise.resolve(readResourceResponse(String(input)))))
    const user = userEvent.setup()

    render(<App />)
    await screen.findByRole('heading', { name: /good (morning|afternoon|evening)/i })
    await user.click(screen.getByRole('button', { name: /choose tonight’s meal/i }))
    await user.click(screen.getAllByRole('button', { name: /cook this meal/i })[0])
    await user.click(screen.getByRole('checkbox', { name: /salmon fillets/i }))
    await user.click(screen.getByRole('button', { name: /next step/i }))
    await user.click(screen.getByRole('button', { name: /next step/i }))

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    await user.click(within(nav).getByRole('button', { name: 'Inventory' }))
    await user.click(within(nav).getByRole('button', { name: 'Today' }))

    expect(screen.getByRole('heading', { name: meals[0].name })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /resume cooking/i }))
    expect(screen.getByRole('checkbox', { name: /salmon fillets/i })).toBeChecked()
    expect(screen.getByText('3 of 5')).toBeInTheDocument()
  })

  it('edits kitchen context and refreshes recommendations through the focused agent API', async () => {
    const added = { id: 'tomato', name: 'Tomato', amount: 4, unit: '', category: 'Produce' as const, lowAt: 1, count: 2, countUnit: 'packs', storage: 'Counter', recordedOn: '2026-09-29', notes: 'Use soon' }
    const fetchMock = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const path = String(input)
      if (path === '/api/v1/household' && init?.method === 'PUT') return Promise.resolve(jsonResponse({ ...initialState.household, goals: ['Use produce first'], preferences: ['Quick meals', 'Seasonal ingredients'] }))
      if (path === '/api/v1/inventory/tomato' && init?.method === 'PUT') return Promise.resolve(jsonResponse({ inventory: [...initialState.inventory, added] }))
      if (path === '/api/v1/recommendations/generate') return Promise.resolve(jsonResponse({ meals: initialState.meals, source: 'fallback' }))
      return Promise.resolve(readResourceResponse(path))
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('heading', { name: /good (morning|afternoon|evening)/i })
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    await user.click(within(nav).getByRole('button', { name: 'Inventory' }))
    const goals = screen.getByLabelText('Kitchen goals')
    await user.clear(goals); await user.type(goals, 'Use produce first')
    const preferences = screen.getByLabelText('Food preferences')
    await user.clear(preferences); await user.type(preferences, 'Quick meals{enter}Seasonal ingredients')
    const height = screen.getByLabelText('Height in centimetres for Member one')
    await user.clear(height); await user.type(height, '172')
    const memberNotes = screen.getByLabelText('Notes for Member one')
    await user.clear(memberNotes); await user.type(memberNotes, 'Prefers shared dishes{enter}Enjoys mild flavours')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    await user.type(screen.getByLabelText('Name'), 'Tomato')
    await user.clear(screen.getByLabelText('Amount')); await user.type(screen.getByLabelText('Amount'), '4')
    await user.click(screen.getByText('Optional details'))
    await user.type(screen.getByLabelText('Count'), '2')
    await user.type(screen.getByLabelText('Count unit'), 'packs')
    await user.type(screen.getByLabelText('Storage'), 'Counter')
    await user.type(screen.getByLabelText('Recorded on'), '2026-09-29')
    await user.type(screen.getByLabelText('Notes', { selector: '.item-notes textarea' }), 'Use soon')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    const tomatoCard = (await screen.findByRole('heading', { name: 'Tomato' })).closest('article')
    expect(tomatoCard).toHaveTextContent('2 packs')
    expect(tomatoCard).toHaveTextContent('Counter')
    expect(tomatoCard).toHaveTextContent('Recorded 2026-09-29')
    expect(tomatoCard).toHaveTextContent('Use soon')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/household', expect.objectContaining({
      method: 'PUT',
      body: expect.stringContaining('"preferences":["Quick meals","Seasonal ingredients"]'),
    }))
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/inventory/tomato', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(added),
    }))

    await user.click(within(nav).getByRole('button', { name: 'Today' }))
    await user.click(screen.getByRole('button', { name: /choose tonight’s meal/i }))
    await user.click(screen.getByRole('button', { name: 'Refresh ideas' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/reliable fallback ideas/i)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/recommendations/generate', expect.objectContaining({ method: 'POST' }))
  })

  it('preserves confirmation feedback across navigation and clears the active task after success', async () => {
    const result = confirmedResult('Keep this note.')
    vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
      const path = String(input)
      return Promise.resolve(path.endsWith('/confirm') ? jsonResponse(result) : readResourceResponse(path))
    }))
    const user = userEvent.setup()

    render(<App />)
    await reachConfirmation(user)
    await user.click(screen.getByRole('radio', { name: /it was okay/i }))
    await user.type(screen.getByPlaceholderText(/everyone loved/i), 'Keep this note.')

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    await user.click(within(nav).getByRole('button', { name: 'History' }))
    await user.click(within(nav).getByRole('button', { name: 'Today' }))
    await user.click(screen.getByRole('button', { name: /review and confirm/i }))

    expect(screen.getByRole('radio', { name: /it was okay/i })).toBeChecked()
    expect(screen.getByPlaceholderText(/everyone loved/i)).toHaveValue('Keep this note.')
    await user.click(screen.getByRole('button', { name: /confirm meal & update inventory/i }))

    expect(await screen.findByText('Dinner is done!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resume cooking|review and confirm/i })).not.toBeInTheDocument()
  })
})
