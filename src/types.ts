export type View = 'today' | 'choose' | 'cook' | 'confirm' | 'inventory' | 'history'

export type Rating = 'loved' | 'okay' | 'not-for-us'

export type HouseholdMember = {
  id: string
  name: string
  initials: string
}

export type Household = {
  name: string
  members: HouseholdMember[]
  constraints: string[]
  goals: string[]
}

export type InventoryItem = {
  id: string
  name: string
  amount: number
  unit: string
  category: 'Produce' | 'Protein' | 'Pantry' | 'Dairy'
  lowAt: number
}

export type MealIngredient = {
  inventoryId: string
  name: string
  amount: number
  unit: string
  optional?: boolean
}

export type Meal = {
  id: string
  name: string
  description: string
  reason: string
  emoji: string
  accent: string
  minutes: number
  difficulty: 'Easy' | 'Medium'
  tags: string[]
  ingredients: MealIngredient[]
  steps: string[]
}

export type HistoryEntry = {
  id: string
  mealId: string
  mealName: string
  emoji: string
  cookedAt: string
  rating: Rating
  note: string
}

export type MealState = {
  household: Household
  inventory: InventoryItem[]
  meals: Meal[]
  history: HistoryEntry[]
  selectedMealId: string | null
}

export type AppState = MealState

export type MealConfirmation = {
  rating: Rating
  note: string
}

export type MealConfirmationResult = Pick<
  MealState,
  'inventory' | 'history' | 'selectedMealId'
>
