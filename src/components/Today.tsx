import { ArrowRight, Check, Clock3, Leaf, PackageOpen, Play, Sparkles, UtensilsCrossed, Users } from 'lucide-react'
import type { Household, InventoryItem, Meal } from '../types'

type Props = {
  household: Household
  inventory: InventoryItem[]
  recommendationCount: number
  cookedTonight?: string
  activeMeal?: Meal
  activeStage?: 'cook' | 'confirm'
  onResume: () => void
  onChoose: () => void
}

function todayHeading(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Today({ household, inventory, recommendationCount, cookedTonight, activeMeal, activeStage, onResume, onChoose }: Props) {
  const lowItems = inventory.filter((item) => item.amount <= item.lowAt).length
  const preferences = [...household.constraints, ...household.goals]
  const ideaLabel = recommendationCount === 1 ? 'idea' : 'ideas'
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div className="page today-page">
      <header className="page-header">
        <div><p className="date-label">{dateLabel}</p><h1>{todayHeading()}, kitchen crew.</h1><p>Let’s make tonight feel easy.</p></div>
        <div className="status-pill"><span className="pulse" /> Inventory synced</div>
      </header>

      {cookedTonight && (
        <div className="success-banner" role="status"><span><Check size={18} /></span><div><strong>Dinner is done!</strong><p>{cookedTonight} was added to your history and your inventory is up to date.</p></div></div>
      )}

      {activeMeal && activeStage && (
        <section className="active-meal-card" aria-labelledby="active-meal-title">
          <div className={`active-meal-art ${activeMeal.accent}`} aria-hidden="true"><UtensilsCrossed /></div>
          <div className="active-meal-copy">
            <span className="eyebrow">IN PROGRESS · {activeStage === 'confirm' ? 'READY TO CONFIRM' : 'COOKING'}</span>
            <h2 id="active-meal-title">{activeMeal.name}</h2>
            <p>{activeStage === 'confirm' ? 'Your feedback and inventory preview are waiting.' : 'Your ingredient checklist and recipe step are saved for this session.'}</p>
          </div>
          <button className="primary-button" onClick={onResume}><Play size={17} /> {activeStage === 'confirm' ? 'Review and confirm' : 'Resume cooking'}</button>
        </section>
      )}

      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow light"><Sparkles size={15} /> TONIGHT'S PLAN</span>
          <h2>What sounds good<br />for dinner?</h2>
          <p>We found {recommendationCount} {ideaLabel} based on what you have, what your household enjoys, and your goals.</p>
          <button className="primary-button inverted" onClick={onChoose}>Choose tonight’s meal <ArrowRight size={18} /></button>
          <span className="helper"><Clock3 size={15} /> Kitchen recommendations are ready to cook</span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="plate"><UtensilsCrossed /></span><span className="floating tomato"><Sparkles /></span><span className="floating leaf"><Leaf /></span><span className="floating lemon"><Sparkles /></span>
        </div>
      </section>

      <div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>Your kitchen today</h2></div></div>
      <div className="stats-grid">
        <article className="stat-card"><span className="stat-icon green"><PackageOpen /></span><div><strong>{inventory.length}</strong><p>items on hand</p></div><small>{lowItems ? `${lowItems} running low` : 'All well stocked'}</small></article>
        <article className="stat-card"><span className="stat-icon coral"><Clock3 /></span><div><strong>{recommendationCount}</strong><p>meal {ideaLabel}</p></div><small>Based on current inventory</small></article>
        <article className="stat-card"><span className="stat-icon yellow"><Users /></span><div><strong>{preferences.length}</strong><p>shared preferences</p></div><small>Applied to every idea</small></article>
      </div>
      <section className="constraint-strip"><span>Safety & goals always on</span><div>{household.constraints.map((constraint) => <b key={constraint}>✓ {constraint}</b>)}{household.goals.map((goal) => <b key={goal}>↗ {goal}</b>)}</div></section>
    </div>
  )
}
