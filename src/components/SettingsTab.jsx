import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { PALETTE, db, nextCategoryId, setSetting } from '../db.js'
import { useCategories, useSettings } from '../hooks.js'
import { useInstallPrompt } from '../pwa.js'
import { exportBackup, importBackup, resetAllData } from '../utils/backup.js'

const CURRENCIES = ['₹', '$', '€', '£', '¥']

export default function SettingsTab({ onClose, onOpenUpdates }) {
  const settings = useSettings()
  const cats = useCategories() || []
  const { canInstall, install } = useInstallPrompt()
  const fileRef = useRef(null)
  const budgetRef = useRef(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    // lock background scroll while settings overlay is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const flash = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  const saveBudget = () =>
    setSetting('monthlyBudget', Math.max(0, Number(budgetRef.current?.value) || 0))

  const incomeCats = cats.filter((c) => c.type === 'income')
  const expenseCats = cats.filter((c) => c.type === 'expense')

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Preferences</span>
          <h2>Settings</h2>
        </div>
        {onClose && (
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <Icon name="close" size={18} />
          </button>
        )}
      </header>

      {msg && <div className="inline-alert">{msg}</div>}

      <section className="card">
        <div className="card-head">
          <h3>Budget &amp; currency</h3>
        </div>
        <label className="field-label" htmlFor="budget">
          Monthly budget
        </label>
        <div className="inline-form">
          <input
            id="budget"
            ref={budgetRef}
            key={`budget-${settings.monthlyBudget}`}
            className="input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            defaultValue={String(Number(settings.monthlyBudget) || '')}
            onBlur={saveBudget}
            onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={saveBudget}>
            Save
          </button>
        </div>
        <label className="field-label" htmlFor="currency">
          Currency
        </label>
        <div className="currency-row">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`currency-chip ${settings.currency === c ? 'active' : ''}`}
              onClick={() => setSetting('currency', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Categories</h3>
          <span className="muted">{cats.length} total</span>
        </div>
        <p className="field-label">Income</p>
        <div className="cat-grid compact">
          {incomeCats.map((c) => (
            <CatChip key={c.id} cat={c} />
          ))}
        </div>
        <p className="field-label">Expense</p>
        <div className="cat-grid compact">
          {expenseCats.map((c) => (
            <CatChip key={c.id} cat={c} />
          ))}
        </div>
        <AddCategory onAdded={() => flash('Category added.')} />
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Data &amp; backup</h3>
        </div>
        <p className="hint">
          Your data lives on this device only. Export a backup before switching phones — imports
          replace everything.
        </p>
        <div className="btn-col">
          <button type="button" className="btn btn-outline" onClick={() => exportBackup()}>
            ⬇️ Export backup (JSON)
          </button>
          <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()}>
            ⬆️ Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                const ok = await importBackup(file)
                if (ok) flash('Backup restored successfully.')
              } catch (err) {
                window.alert(`Import failed: ${err.message}`)
              }
            }}
          />
          <button type="button" className="btn btn-danger-outline" onClick={() => resetAllData()}>
            🗑️ Reset all data
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>App &amp; updates</h3>
          <span className="muted">v1.0.0</span>
        </div>
        <div className="btn-col">
          {onOpenUpdates && (
            <button type="button" className="btn btn-outline" onClick={onOpenUpdates}>
              🔔 What&apos;s new
            </button>
          )}
          {canInstall ? (
            <button type="button" className="btn btn-primary" onClick={() => install()}>
              📲 Install app on phone
            </button>
          ) : (
            <p className="hint">
              Already installed, or use your browser menu → <strong>Add to Home screen</strong>.
            </p>
          )}
        </div>
        <p className="hint">
          Updates arrive via <strong>git sync → rebuild → deploy</strong>. Your transactions never
          leave this device, so reinstalling or updating never erases them.
        </p>
      </section>
    </>
  )
}

function CatChip({ cat }) {
  return (
    <span className="cat-chip static" style={{ borderColor: `${cat.color}66` }}>
      <span>{cat.emoji}</span>
      {cat.name}
      <button
        type="button"
        className="cat-remove"
        aria-label={`Delete ${cat.name}`}
        onClick={async () => {
          if (!window.confirm(`Delete category "${cat.name}"? Transactions keep their labels.`)) return
          await db.categories.delete(cat.id)
        }}
      >
        ×
      </button>
    </span>
  )
}

function AddCategory({ onAdded }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [error, setError] = useState('')

  const add = async () => {
    const n = name.trim()
    if (!n) return
    setError('')
    try {
      const exists = await db.categories
        .filter((c) => c.type === type && c.name.toLowerCase() === n.toLowerCase())
        .count()
      if (exists) {
        setError('That category already exists.')
        return
      }
      const color = PALETTE[(await db.categories.count()) % PALETTE.length]
      const id = await nextCategoryId()
      await db.categories.add({ id, name: n, emoji: '🏷️', type, color })
      setName('')
      onAdded?.()
    } catch {
      setError('Could not add the category. Please try again.')
    }
  }

  return (
    <>
      <div className="inline-form wrap">
        <input
          className="input grow"
          placeholder="New category name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="button" className="btn btn-primary btn-sm" onClick={add}>
          Add
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </>
  )
}
