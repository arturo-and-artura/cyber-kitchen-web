import { AlertCircle, PackageOpen, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { HouseholdUpdate } from '../lib/api'
import { formatAmount } from '../lib/store'
import type { Household, HouseholdMember, InventoryItem } from '../types'

type Props = {
  household: Household
  inventory: InventoryItem[]
  onSaveHousehold: (profile: HouseholdUpdate) => Promise<void>
  onSaveItem: (item: InventoryItem) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  error?: string
}

const emptyItem: InventoryItem = { id: '', name: '', amount: 1, unit: '', category: 'Produce', lowAt: 1 }
const lines = (value: string) => value.split('\n').map((item) => item.trim()).filter(Boolean)
const optionalNumber = (value: string) => value === '' ? undefined : Number(value)

function itemMetadata(item: InventoryItem) {
  return [
    item.count !== undefined ? `${item.count}${item.countUnit ? ` ${item.countUnit}` : ''}` : undefined,
    item.storage,
    item.recordedOn ? `Recorded ${item.recordedOn}` : undefined,
    item.notes,
  ].filter((value): value is string => Boolean(value))
}

export function Inventory({ household, inventory, onSaveHousehold, onSaveItem, onDeleteItem, error }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [constraints, setConstraints] = useState(household.constraints.join('\n'))
  const [goals, setGoals] = useState(household.goals.join('\n'))
  const [preferences, setPreferences] = useState(household.preferences.join('\n'))
  const [members, setMembers] = useState<HouseholdMember[]>(household.members)
  const [draft, setDraft] = useState<InventoryItem>(emptyItem)
  const [saving, setSaving] = useState(false)
  const visible = useMemo(() => inventory.filter((item) => (category === 'All' || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase())), [inventory, query, category])
  const categories = ['All', 'Produce', 'Fruit', 'Protein', 'Prepared', 'Dairy', 'Pantry', 'Condiment']

  const updateMember = (id: string, update: Partial<HouseholdMember>) => {
    setMembers((current) => current.map((member) => member.id === id ? { ...member, ...update } : member))
  }
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSaveHousehold({
        members,
        constraints: lines(constraints),
        goals: lines(goals),
        preferences: lines(preferences),
      })
    } finally { setSaving(false) }
  }
  const addItem = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const id = draft.id || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    try { await onSaveItem({ ...draft, id }); setDraft(emptyItem) } finally { setSaving(false) }
  }

  return <div className="page">
    <header className="page-header"><div><p className="date-label">YOUR KITCHEN</p><h1>Inventory & profile</h1><p>Keep the state used by your kitchen agent accurate.</p></div><div className="status-pill"><span className="pulse" /> Saved to kitchen</div></header>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="editor-panel" aria-labelledby="profile-heading">
      <h2 id="profile-heading">Household guidance</h2>
      <form onSubmit={saveProfile} className="profile-form">
        <div className="guidance-fields">
          <label>Safety constraints <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder={'One constraint per line'} /></label>
          <label>Kitchen goals <textarea value={goals} onChange={(event) => setGoals(event.target.value)} placeholder={'One goal per line'} /></label>
          <label>Food preferences <textarea value={preferences} onChange={(event) => setPreferences(event.target.value)} placeholder={'One preference per line'} /></label>
        </div>
        <fieldset className="member-fields">
          <legend>Household members</legend>
          {members.map((member) => <div className="member-editor" key={member.id}>
            <strong>{member.name}</strong>
            <label>Height (cm) <input aria-label={`Height in centimetres for ${member.name}`} type="number" min="0" step="any" value={member.heightCm ?? ''} onChange={(event) => updateMember(member.id, { heightCm: optionalNumber(event.target.value) })} /></label>
            <label>Notes <textarea aria-label={`Notes for ${member.name}`} value={(member.notes ?? []).join('\n')} onChange={(event) => updateMember(member.id, { notes: lines(event.target.value) })} placeholder="One note per line" /></label>
          </div>)}
        </fieldset>
        <button className="secondary-button profile-save" disabled={saving}>Save profile</button>
      </form>
    </section>
    <section className="editor-panel" aria-labelledby="add-heading">
      <h2 id="add-heading">Add an ingredient</h2>
      <form onSubmit={addItem} className="item-form">
        <div className="item-core-fields">
          <label>Name <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Amount <input required type="number" min="0" step="any" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} /></label>
          <label>Unit <input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /></label>
          <label>Category <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as InventoryItem['category'] })}>{categories.slice(1).map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        <details className="optional-fields">
          <summary>Optional details</summary>
          <div>
            <label>Count <input type="number" min="0" step="any" value={draft.count ?? ''} onChange={(event) => setDraft({ ...draft, count: optionalNumber(event.target.value) })} /></label>
            <label>Count unit <input value={draft.countUnit ?? ''} onChange={(event) => setDraft({ ...draft, countUnit: event.target.value || undefined })} placeholder="packages" /></label>
            <label>Storage <input value={draft.storage ?? ''} onChange={(event) => setDraft({ ...draft, storage: event.target.value || undefined })} placeholder="Pantry shelf" /></label>
            <label>Recorded on <input type="date" value={draft.recordedOn ?? ''} onChange={(event) => setDraft({ ...draft, recordedOn: event.target.value || undefined })} /></label>
            <label className="item-notes">Notes <textarea value={draft.notes ?? ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value || undefined })} /></label>
          </div>
        </details>
        <button className="primary-button" disabled={saving}><Plus size={16} /> Add</button>
      </form>
    </section>
    <div className="toolbar"><label className="search"><Search size={18} /><span className="sr-only">Search inventory</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ingredients" /></label><div className="filter-tabs">{categories.map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
    <div className="inventory-grid">{visible.map((item) => {
      const metadata = itemMetadata(item)
      return <article key={item.id} className="inventory-card"><span className={`category-icon ${item.category.toLowerCase()}`}><PackageOpen size={20} /></span><div className="inventory-copy"><h2>{item.name}</h2><p>{item.category}</p>{metadata.length > 0 && <ul className="inventory-metadata" aria-label={`${item.name} details`}>{metadata.map((value, index) => <li key={`${index}-${value}`}>{value}</li>)}</ul>}</div><strong>{formatAmount(item.amount, item.unit)}</strong><div className="inventory-actions"><button aria-label={`Decrease ${item.name}`} onClick={() => onSaveItem({ ...item, amount: Math.max(0, item.amount - 1) })}>−</button><button aria-label={`Increase ${item.name}`} onClick={() => onSaveItem({ ...item, amount: item.amount + 1 })}>+</button><button aria-label={`Delete ${item.name}`} onClick={() => onDeleteItem(item.id)}><Trash2 size={15} /></button></div>{item.amount <= item.lowAt && <span className="low-badge"><AlertCircle size={13} /> Running low</span>}</article>
    })}</div>
    {!visible.length && <div className="empty-state"><PackageOpen /><h2>No ingredients found</h2><p>Try another search or category.</p></div>}
  </div>
}
