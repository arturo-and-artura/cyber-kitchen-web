import { AlertCircle, PackageOpen, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Household, InventoryItem } from '../types'
import { formatAmount } from '../lib/store'

type Props = {
  household: Household
  inventory: InventoryItem[]
  onSaveHousehold: (profile: Pick<Household, 'constraints' | 'goals'>) => Promise<void>
  onSaveItem: (item: InventoryItem) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  error?: string
}

const emptyItem: InventoryItem = { id: '', name: '', amount: 1, unit: '', category: 'Produce', lowAt: 1 }
const list = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

export function Inventory({ household, inventory, onSaveHousehold, onSaveItem, onDeleteItem, error }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [constraints, setConstraints] = useState(household.constraints.join(', '))
  const [goals, setGoals] = useState(household.goals.join(', '))
  const [draft, setDraft] = useState(emptyItem)
  const [saving, setSaving] = useState(false)
  const visible = useMemo(() => inventory.filter((item) => (category === 'All' || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase())), [inventory, query, category])
  const categories = ['All', 'Produce', 'Protein', 'Pantry', 'Dairy']

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true)
    try { await onSaveHousehold({ constraints: list(constraints), goals: list(goals) }) } finally { setSaving(false) }
  }
  const addItem = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true)
    const id = draft.id || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    try { await onSaveItem({ ...draft, id }); setDraft(emptyItem) } finally { setSaving(false) }
  }

  return <div className="page">
    <header className="page-header"><div><p className="date-label">YOUR KITCHEN</p><h1>Inventory & profile</h1><p>Keep the state used by your kitchen agent accurate.</p></div><div className="status-pill"><span className="pulse" /> Saved to kitchen</div></header>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="editor-panel" aria-labelledby="profile-heading">
      <h2 id="profile-heading">Household guidance</h2>
      <form onSubmit={saveProfile} className="profile-form">
        <label>Safety constraints <input value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Peanut-free, Dairy-light" /></label>
        <label>Kitchen goals <input value={goals} onChange={(event) => setGoals(event.target.value)} placeholder="High protein, Less food waste" /></label>
        <button className="secondary-button" disabled={saving}>Save profile</button>
      </form>
    </section>
    <section className="editor-panel" aria-labelledby="add-heading">
      <h2 id="add-heading">Add an ingredient</h2>
      <form onSubmit={addItem} className="item-form">
        <label>Name <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>Amount <input required type="number" min="0" step="any" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} /></label>
        <label>Unit <input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /></label>
        <label>Category <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as InventoryItem['category'] })}>{categories.slice(1).map((value) => <option key={value}>{value}</option>)}</select></label>
        <button className="primary-button" disabled={saving}><Plus size={16} /> Add</button>
      </form>
    </section>
    <div className="toolbar"><label className="search"><Search size={18} /><span className="sr-only">Search inventory</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ingredients" /></label><div className="filter-tabs">{categories.map((item) => <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
    <div className="inventory-grid">{visible.map((item) => <article key={item.id} className="inventory-card"><span className={`category-icon ${item.category.toLowerCase()}`}><PackageOpen size={20} /></span><div><h2>{item.name}</h2><p>{item.category}</p></div><strong>{formatAmount(item.amount, item.unit)}</strong><div className="inventory-actions"><button aria-label={`Decrease ${item.name}`} onClick={() => onSaveItem({ ...item, amount: Math.max(0, item.amount - 1) })}>−</button><button aria-label={`Increase ${item.name}`} onClick={() => onSaveItem({ ...item, amount: item.amount + 1 })}>+</button><button aria-label={`Delete ${item.name}`} onClick={() => onDeleteItem(item.id)}><Trash2 size={15} /></button></div>{item.amount <= item.lowAt && <span className="low-badge"><AlertCircle size={13} /> Running low</span>}</article>)}</div>
    {!visible.length && <div className="empty-state"><PackageOpen /><h2>No ingredients found</h2><p>Try another search or category.</p></div>}
  </div>
}
