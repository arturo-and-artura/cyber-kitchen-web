import { CalendarDays, ChefHat, Clock3, PackageOpen, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { Household, View } from '../types'

type Props = { household: Household; view: View; setView: (view: View) => void; children: ReactNode }

export function Shell({ household, view, setView, children }: Props) {
  const { locale, setLocale, t } = useI18n()
  const activeView = view === 'choose' || view === 'cook' || view === 'confirm' ? 'today' : view
  const nav = [
    { id: 'today' as const, label: t('nav.today'), icon: CalendarDays },
    { id: 'inventory' as const, label: t('nav.inventory'), icon: PackageOpen },
    { id: 'history' as const, label: t('nav.history'), icon: Clock3 },
  ]
  const profileItems = [...household.constraints, ...household.goals]

  return <div className="app-shell">
    <aside className="sidebar" aria-label={t('nav.label')}>
      <button className="brand" onClick={() => setView('today')} aria-label={t('brand.home')}><span className="brand-mark"><ChefHat size={22} /></span><span><strong>Cyber Kitchen</strong><small>{t('brand.tagline')}</small></span></button>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'nav-item active' : 'nav-item'} aria-current={activeView === id ? 'page' : undefined} onClick={() => setView(id)}><Icon size={19} /> {label}</button>)}</nav>
      <label className="language-selector">{t('language.label')}<select value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'zh-CN')}><option value="en">{t('language.en')}</option><option value="zh-CN">{t('language.zh-CN')}</option></select></label>
      <div className="household-card"><span className="eyebrow"><Sparkles size={13} /> {t('household.profile')}</span><strong>{household.name}</strong><div className="avatar-row" aria-label={t('household.members')}>{household.members.map((member) => <span key={member.id} title={member.name}>{member.initials}</span>)}</div><p>{profileItems.join(' · ')}</p></div>
    </aside>
    <main id="main-content">{children}</main>
    <nav className="mobile-nav" aria-label={t('nav.label')}>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'active' : ''} aria-current={activeView === id ? 'page' : undefined} onClick={() => setView(id)}><Icon size={20} /><span>{label}</span></button>)}<label className="mobile-language"><span className="sr-only">{t('language.label')}</span><select aria-label={t('language.label')} value={locale} onChange={(event) => setLocale(event.target.value as 'en' | 'zh-CN')}><option value="en">EN</option><option value="zh-CN">中文</option></select></label></nav>
  </div>
}
