import { ArrowLeft, ArrowRight, Check, Clock3, PackageOpen, Sparkles } from 'lucide-react'
import type { Household, Meal } from '../types'

type Props = { household: Household; meals: Meal[]; activeMealId?: string; onBack: () => void; onSelect: (meal: Meal) => void }

export function ChooseMeal({ household, meals, activeMealId, onBack, onSelect }: Props) {
  const matchLabel = meals.length === 1 ? 'ONE THOUGHTFUL MATCH' : `${meals.length} THOUGHTFUL MATCHES`
  return (
    <div className="page choose-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Today</button>
      <header className="choice-header"><span className="eyebrow"><Sparkles size={14} /> {matchLabel}</span><h1>Pick tonight’s dinner</h1><p>Every option respects your household profile. We’ve explained why each one made the list.</p></header>
      {meals.length ? (
        <div className="meal-grid">
          {meals.map((meal, index) => (
            <article className="meal-card" key={meal.id}>
              <div className={`meal-art ${meal.accent}`}><span>{meal.name.split(' ')[0]}</span>{index === 0 && <b>Best match</b>}</div>
              <div className="meal-body">
                <div className="meal-meta"><span><Clock3 size={14} /> {meal.minutes} min</span><span>{meal.difficulty}</span></div>
                <h2>{meal.name}</h2><p>{meal.description}</p>
                <div className="why"><Sparkles size={17} /><div><strong>Why this works tonight</strong><p>{meal.reason}</p></div></div>
                <div className="tag-row">{meal.tags.map((tag) => <span key={tag}><Check size={13} />{tag}</span>)}</div>
                <button className="primary-button" onClick={() => onSelect(meal)}>{activeMealId === meal.id ? 'Resume this meal' : 'Cook this meal'} <ArrowRight size={17} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state recommendation-empty"><PackageOpen /><h2>No meal ideas are ready yet</h2><p>Once recommendations are available, they’ll appear here with clear household-fit reasons.</p></section>
      )}
      {!!household.constraints.length && <p className="safety-note"><Check size={15} /> Every option respects: {household.constraints.join(' · ')}.</p>}
    </div>
  )
}
