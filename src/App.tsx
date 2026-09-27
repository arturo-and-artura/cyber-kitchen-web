import { useEffect, useMemo, useState } from 'react'
import { ChooseMeal } from './components/ChooseMeal'
import { ConfirmMeal } from './components/ConfirmMeal'
import { CookMeal } from './components/CookMeal'
import { History } from './components/History'
import { Inventory } from './components/Inventory'
import { Shell } from './components/Shell'
import { Today } from './components/Today'
import { confirmMeal, getMealState } from './lib/api'
import type { AppState, Meal, Rating, View } from './types'

function withValidSelection(state: AppState): AppState {
  return state.selectedMealId && !state.meals.some((meal) => meal.id === state.selectedMealId)
    ? { ...state, selectedMealId: null }
    : state
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export default function App() {
  const [view, setView] = useState<View>('today')
  const [state, setState] = useState<AppState | null>(null)
  const [loadError, setLoadError] = useState<string>()
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [confirmationError, setConfirmationError] = useState<string>()
  const [isConfirming, setIsConfirming] = useState(false)
  const [latestMeal, setLatestMeal] = useState<string>()

  useEffect(() => {
    const controller = new AbortController()

    getMealState(controller.signal)
      .then((nextState) => setState(withValidSelection(nextState)))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return
        setLoadError(errorMessage(error))
      })

    return () => controller.abort()
  }, [loadAttempt])

  const selectedMeal = useMemo(
    () => state?.meals.find((meal) => meal.id === state.selectedMealId) ?? null,
    [state],
  )

  if (!state) {
    return (
      <main className="app-status" aria-live="polite">
        {loadError ? (
          <div className="status-card" role="alert">
            <h1>We couldn’t load your kitchen.</h1>
            <p>{loadError}</p>
            <button className="primary-button" onClick={() => { setLoadError(undefined); setLoadAttempt((attempt) => attempt + 1) }}>Try again</button>
          </div>
        ) : (
          <div className="status-card" role="status">
            <span className="loading-mark" aria-hidden="true" />
            <h1>Getting your kitchen ready…</h1>
            <p>Loading your household, inventory, and meal ideas.</p>
          </div>
        )}
      </main>
    )
  }

  const selectMeal = (meal: Meal) => {
    setState((current) => current ? { ...current, selectedMealId: meal.id } : current)
    setConfirmationError(undefined)
    setView('cook')
    window.scrollTo(0, 0)
  }

  const confirm = async (rating: Rating, note: string) => {
    if (!selectedMeal || isConfirming) return

    setIsConfirming(true)
    setConfirmationError(undefined)
    try {
      const nextState = withValidSelection(await confirmMeal(selectedMeal.id, { rating, note }))
      setState(nextState)
      setLatestMeal(selectedMeal.name)
      setView('today')
      window.scrollTo(0, 0)
    } catch (error) {
      setConfirmationError(errorMessage(error))
    } finally {
      setIsConfirming(false)
    }
  }

  let content
  if (view === 'choose') content = <ChooseMeal meals={state.meals} onBack={() => setView('today')} onSelect={selectMeal} />
  else if (view === 'cook' && selectedMeal) content = <CookMeal meal={selectedMeal} inventory={state.inventory} onBack={() => setView('choose')} onFinish={() => setView('confirm')} />
  else if (view === 'confirm' && selectedMeal) content = <ConfirmMeal meal={selectedMeal} state={state} onBack={() => setView('cook')} onConfirm={confirm} isConfirming={isConfirming} error={confirmationError} />
  else if (view === 'inventory') content = <Inventory inventory={state.inventory} />
  else if (view === 'history') content = <History history={state.history} />
  else content = <Today household={state.household} inventory={state.inventory} recommendationCount={state.meals.length} cookedTonight={latestMeal} onChoose={() => setView('choose')} />

  return <Shell household={state.household} view={view} setView={setView}>{content}</Shell>
}
