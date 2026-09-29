import { useEffect, useMemo, useState } from 'react'
import { ChooseMeal } from './components/ChooseMeal'
import { ConfirmMeal } from './components/ConfirmMeal'
import { CookMeal } from './components/CookMeal'
import { History } from './components/History'
import { Inventory } from './components/Inventory'
import { Shell } from './components/Shell'
import { Today } from './components/Today'
import { confirmMeal, deleteInventory, generateRecommendations, getMealState, putInventory, updateHousehold } from './lib/api'
import type { Household, InventoryItem, Meal, MealState, Rating, View } from './types'

type ActiveStage = 'cook' | 'confirm'

function withValidSelection(state: MealState): MealState {
  return state.selectedMealId && !state.meals.some((meal) => meal.id === state.selectedMealId)
    ? { ...state, selectedMealId: null }
    : state
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export default function App() {
  const [view, setView] = useState<View>('today')
  const [state, setState] = useState<MealState | null>(null)
  const [loadError, setLoadError] = useState<string>()
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [confirmationError, setConfirmationError] = useState<string>()
  const [isConfirming, setIsConfirming] = useState(false)
  const [latestMeal, setLatestMeal] = useState<string>()
  const [activeStage, setActiveStage] = useState<ActiveStage>()
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([])
  const [cookingStep, setCookingStep] = useState(0)
  const [rating, setRating] = useState<Rating>('loved')
  const [note, setNote] = useState('')
  const [editError, setEditError] = useState<string>()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSource, setGenerationSource] = useState<'model' | 'fallback'>()
  const [generationError, setGenerationError] = useState<string>()

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
    if (state.selectedMealId === meal.id && activeStage) {
      setView(activeStage)
      window.scrollTo(0, 0)
      return
    }

    setState((current) => current ? { ...current, selectedMealId: meal.id } : current)
    setActiveStage('cook')
    setCheckedIngredients([])
    setCookingStep(0)
    setRating('loved')
    setNote('')
    setConfirmationError(undefined)
    setView('cook')
    window.scrollTo(0, 0)
  }

  const confirm = async () => {
    if (!selectedMeal || isConfirming) return

    setIsConfirming(true)
    setConfirmationError(undefined)
    try {
      const confirmationResult = await confirmMeal(selectedMeal.id, { rating, note })
      setState((current) => current
        ? withValidSelection({ ...current, ...confirmationResult })
        : current)
      setLatestMeal(selectedMeal.name)
      setActiveStage(undefined)
      setCheckedIngredients([])
      setCookingStep(0)
      setRating('loved')
      setNote('')
      setView('today')
      window.scrollTo(0, 0)
    } catch (error) {
      setConfirmationError(errorMessage(error))
    } finally {
      setIsConfirming(false)
    }
  }

  const saveHousehold = async (profile: Pick<Household, 'constraints' | 'goals'>) => {
    setEditError(undefined)
    try {
      const household = await updateHousehold(profile)
      setState((current) => current ? { ...current, household } : current)
    } catch (error) { setEditError(errorMessage(error)); throw error }
  }

  const saveInventory = async (item: InventoryItem) => {
    setEditError(undefined)
    try {
      const result = await putInventory(item)
      setState((current) => current ? { ...current, inventory: result.inventory } : current)
    } catch (error) { setEditError(errorMessage(error)); throw error }
  }

  const removeInventory = async (id: string) => {
    setEditError(undefined)
    try {
      const result = await deleteInventory(id)
      setState((current) => current ? { ...current, inventory: result.inventory } : current)
    } catch (error) { setEditError(errorMessage(error)); throw error }
  }

  const regenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true); setGenerationError(undefined)
    try {
      const result = await generateRecommendations()
      setState((current) => current ? { ...current, meals: result.meals, selectedMealId: null } : current)
      setGenerationSource(result.source)
      setActiveStage(undefined)
    } catch (error) { setGenerationError(errorMessage(error)) }
    finally { setIsGenerating(false) }
  }

  const resumeMeal = () => {
    if (!selectedMeal || !activeStage) return
    setView(activeStage)
    window.scrollTo(0, 0)
  }

  let content
  if (view === 'choose') content = <ChooseMeal household={state.household} meals={state.meals} activeMealId={selectedMeal?.id} onBack={() => setView('today')} onSelect={selectMeal} onRegenerate={regenerate} isGenerating={isGenerating} generationSource={generationSource} error={generationError} />
  else if (view === 'cook' && selectedMeal) content = <CookMeal meal={selectedMeal} inventory={state.inventory} servingCount={state.household.members.length} checked={checkedIngredients} step={cookingStep} onToggleIngredient={(id) => setCheckedIngredients((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onStepChange={setCookingStep} onBack={() => setView('choose')} onFinish={() => { setActiveStage('confirm'); setView('confirm') }} />
  else if (view === 'confirm' && selectedMeal) content = <ConfirmMeal meal={selectedMeal} state={state} rating={rating} note={note} onRatingChange={setRating} onNoteChange={setNote} onBack={() => { setActiveStage('cook'); setView('cook') }} onConfirm={confirm} isConfirming={isConfirming} error={confirmationError} />
  else if (view === 'inventory') content = <Inventory household={state.household} inventory={state.inventory} onSaveHousehold={saveHousehold} onSaveItem={saveInventory} onDeleteItem={removeInventory} error={editError} />
  else if (view === 'history') content = <History history={state.history} />
  else content = <Today household={state.household} inventory={state.inventory} recommendationCount={state.meals.length} cookedTonight={latestMeal} activeMeal={selectedMeal ?? undefined} activeStage={activeStage} onResume={resumeMeal} onChoose={() => setView('choose')} />

  return <Shell household={state.household} view={view} setView={setView}>{content}</Shell>
}
