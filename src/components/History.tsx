import { CalendarDays, Heart, Meh, Sparkles, ThumbsDown, UtensilsCrossed } from 'lucide-react'
import { useI18n } from '../i18n'
import type { HistoryEntry } from '../types'

const icons = { loved: Heart, okay: Meh, 'not-for-us': ThumbsDown }
export function History({ history }: { history: HistoryEntry[] }) {
  const { locale, t } = useI18n()
  const newestFirst = [...history].sort((left, right) => Date.parse(right.cookedAt) - Date.parse(left.cookedAt))
  return <div className="page"><header className="page-header"><div><p className="date-label">{t('history.label')}</p><h1>{t('history.title')}</h1><p>{t('history.body')}</p></div></header><section className="history-summary"><Sparkles size={22} /><div><strong>{t('history.favorites', { count: history.filter((entry) => entry.rating === 'loved').length })}</strong><p>{t('history.help')}</p></div></section><div className="timeline">{newestFirst.map((entry) => { const Icon = icons[entry.rating]; return <article key={entry.id} className="history-card"><div className="history-emoji"><UtensilsCrossed /></div><div className="history-content"><div><span><CalendarDays size={14} /> {new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(entry.cookedAt))}</span><span className={`rating ${entry.rating}`}><Icon size={14} /> {t(`rating.${entry.rating}`)}</span></div><h2>{entry.mealName}</h2>{entry.note && <blockquote>“{entry.note}”</blockquote>}</div></article> })}</div></div>
}
