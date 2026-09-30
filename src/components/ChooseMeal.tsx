import { ArrowLeft, ArrowRight, Check, Clock3, PackageOpen, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import type { Household, Meal } from '../types'

type Props = { household: Household; meals: Meal[]; activeMealId?: string; onBack: () => void; onSelect: (meal: Meal) => void; onRegenerate: () => void; isGenerating: boolean; generationSource?: 'model' | 'fallback'; error?: string }

export function ChooseMeal({ household, meals, activeMealId, onBack, onSelect, onRegenerate, isGenerating, generationSource, error }: Props) {
  const { t } = useI18n()
  const matchLabel = meals.length === 1 ? t('choose.oneMatch') : t('choose.matches', { count: meals.length })
  return <div className="page choose-page">
    <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> {t('choose.back')}</button>
    <header className="choice-header"><span className="eyebrow"><Sparkles size={14} /> {matchLabel}</span><h1>{t('choose.title')}</h1><p>{t('choose.body')}</p><button className="secondary-button" onClick={onRegenerate} disabled={isGenerating}><Sparkles size={15} /> {isGenerating ? t('choose.thinking') : t('choose.refresh')}</button>{generationSource && <p className="agent-status" role="status">{generationSource === 'model' ? t('choose.model') : t('choose.fallback')}</p>}{error && <p className="form-error" role="alert">{error}</p>}</header>
    {meals.length ? <div className="meal-grid">{meals.map((meal, index) => <article className="meal-card" key={meal.id}><div className={`meal-art ${meal.accent}`}><span>{meal.name.split(' ')[0]}</span>{index === 0 && <b>{t('choose.best')}</b>}</div><div className="meal-body"><div className="meal-meta"><span><Clock3 size={14} /> {t('choose.minutes', { count: meal.minutes })}</span><span>{t(`difficulty.${meal.difficulty}`)}</span></div><h2>{meal.name}</h2><p>{meal.description}</p><div className="why"><Sparkles size={17} /><div><strong>{t('choose.why')}</strong><p>{meal.reason}</p></div></div><div className="tag-row">{meal.tags.map((tag) => <span key={tag}><Check size={13} />{tag}</span>)}</div><button className="primary-button" onClick={() => onSelect(meal)}>{activeMealId === meal.id ? t('choose.resume') : t('choose.cook')} <ArrowRight size={17} /></button></div></article>)}</div> : <section className="empty-state recommendation-empty"><PackageOpen /><h2>{t('choose.emptyTitle')}</h2><p>{t('choose.emptyBody')}</p></section>}
    {!!household.constraints.length && <p className="safety-note"><Check size={15} /> {t('choose.respects', { constraints: household.constraints.join(' · ') })}</p>}
  </div>
}
