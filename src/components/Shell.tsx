import { CalendarDays, ChefHat, Clock3, PackageOpen, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Household, View } from '../types'

type Props = { household: Household; view: View; setView: (view: View) => void; children: ReactNode }

export function Shell({ household, view, setView, children }: Props) {
  const activeView = view === 'choose' || view === 'cook' || view === 'confirm' ? 'today' : view
  const nav = [
    { id: 'today' as const, label: 'Today', icon: CalendarDays },
    { id: 'inventory' as const, label: 'Inventory', icon: PackageOpen },
    { id: 'history' as const, label: 'History', icon: Clock3 },
  ]
  const profileItems = [...household.constraints, ...household.goals]

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <button className="brand" onClick={() => setView('today')} aria-label="Cyber Kitchen home">
          <span className="brand-mark"><ChefHat size={22} /></span>
          <span><strong>Cyber Kitchen</strong><small>Thoughtful meals, together</small></span>
        </button>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeView === id ? 'nav-item active' : 'nav-item'} aria-current={activeView === id ? 'page' : undefined} onClick={() => setView(id)}>
              <Icon size={19} /> {label}
            </button>
          ))}
        </nav>
        <div className="household-card">
          <span className="eyebrow"><Sparkles size={13} /> Household profile</span>
          <strong>{household.name}</strong>
          <div className="avatar-row" aria-label="Household members">{household.members.map((member) => <span key={member.id} title={member.name}>{member.initials}</span>)}</div>
          <p>{profileItems.join(' · ')}</p>
        </div>
      </aside>
      <main id="main-content">{children}</main>
      <nav className="mobile-nav" aria-label="Main navigation">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeView === id ? 'active' : ''} aria-current={activeView === id ? 'page' : undefined} onClick={() => setView(id)}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
