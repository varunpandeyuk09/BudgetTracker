import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { PALETTE, SUGGESTED_CATEGORIES, db, nextCategoryId } from '../db.js'
import { useCategories, useSettings } from '../hooks.js'
import { todayISO } from '../utils/format.js'
import { guessEmoji } from '../utils/emoji.js'

// Quick-pick pills shown before the "More" dropdown.
const QUICK_CATS = {
  expense: ['Food', 'Groceries', 'Transport'],
  income: ['Salary', 'Freelance', 'Business'],
}

export default function TransactionForm({ txn, onClose }) {
  const [type, setType] = useState(txn?.type || 'expense')
  const [amount, setAmount] = useState(txn ? String(txn.amount) : '')
  const [selected, setSelected] = useState(
    txn ? { name: txn.category, emoji: txn.emoji, color: txn.color } : null,
  )
  const [date, setDate] = useState(txn?.date || todayISO())
  const [note, setNote] = useState(txn?.note || '')
  const [addingCat, setAddingCat] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [error, setError] = useState('')
  const settings = useSettings()
  const cats = useCategories(type) || []

  const quick = QUICK_CATS[type].map((n) => cats.find((c) => c.name === n)).filter(Boolean)
  const quickNames = new Set(quick.map((c) => c.name))
  const rest = cats.filter((c) => !quickNames.has(c.name) && c.name.toLowerCase() !== 'other')
  const existingNames = new Set(cats.map((c) => c.name.toLowerCase()))
  const suggested = SUGGESTED_CATEGORIES[type].filter((n) => !existingNames.has(n.toLowerCase()))
  const selectedInQuick = !!selected && quickNames.has(selected.name)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (menuOpen) setMenuOpen(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (!e.target.closest?.('.cat-area')) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  const save = async () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return setError('Enter an amount greater than zero.')
    if (!selected) return setError('Pick a category.')
    const row = {
      type,
      amount: amt,
      category: selected.name,
      emoji: selected.emoji,
      color: selected.color,
      date,
      note: note.trim(),
    }
    if (txn) await db.transactions.update(txn.id, row)
    else await db.transactions.add({ ...row, createdAt: Date.now() })
    onClose()
  }

  const remove = async () => {
    if (!window.confirm('Delete this transaction?')) return
    await db.transactions.delete(txn.id)
    onClose()
  }

  const selectCat = (c) => {
    setSelected({ name: c.name, emoji: c.emoji, color: c.color })
    setError('')
    setMenuOpen(false)
  }

  const createAndSelect = async (name) => {
    const dup = cats.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (dup) {
      setSelected({ name: dup.name, emoji: dup.emoji, color: dup.color })
      setError('')
      return true
    }
    try {
      const color = PALETTE[(await db.categories.count()) % PALETTE.length]
      const id = await nextCategoryId()
      const emoji = guessEmoji(name)
      await db.categories.add({ id, name, emoji, type, color })
      setSelected({ name, emoji, color })
      setError('')
      return true
    } catch {
      setError('Could not add the category. Please try again.')
      return false
    }
  }

  const addCategory = async () => {
    const name = newCat.trim()
    if (!name) return
    if (await createAndSelect(name)) {
      setNewCat('')
      setAddingCat(false)
    }
  }

  const pickSuggested = async (name) => {
    if (await createAndSelect(name)) setMenuOpen(false)
  }

  const chipStyle = (c) => ({ borderColor: c.color, background: `${c.color}1f` })

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{txn ? 'Edit transaction' : 'New transaction'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="segmented full">
          <button
            type="button"
            className={type === 'expense' ? 'active' : ''}
            onClick={() => {
              setType('expense')
              setSelected(null)
            }}
          >
            Expense
          </button>
          <button
            type="button"
            className={type === 'income' ? 'active' : ''}
            onClick={() => {
              setType('income')
              setSelected(null)
            }}
          >
            Income
          </button>
        </div>

        <div className="amount-input">
          <span>{settings.currency}</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            autoFocus={!txn}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^0-9.]/g, ''))
              setError('')
            }}
            aria-label="Amount"
          />
        </div>

        <label className="field-label">Category</label>
        <div className="cat-area">
          <div className="cat-grid">
            {quick.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cat-chip ${selected?.name === c.name ? 'active' : ''}`}
                style={selected?.name === c.name ? chipStyle(c) : undefined}
                onClick={() => selectCat(c)}
              >
                <span>{c.emoji}</span>
                {c.name}
              </button>
            ))}
            {selected && !selectedInQuick && (
              <button
                key="selected-cat"
                type="button"
                className="cat-chip active"
                style={chipStyle(selected)}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span>{selected.emoji}</span>
                {selected.name}
              </button>
            )}
            <button
              type="button"
              className={`cat-chip add ${menuOpen ? 'active' : ''}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span>▾</span> More
            </button>
          </div>

          {menuOpen && (
            <div className="cat-menu">
              <button
                type="button"
                className="cat-chip other"
                onClick={() => {
                  setMenuOpen(false)
                  setAddingCat(true)
                }}
              >
                <span>➕</span> Other
              </button>
              {rest.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cat-chip ${selected?.name === c.name ? 'active' : ''}`}
                  style={selected?.name === c.name ? chipStyle(c) : undefined}
                  onClick={() => selectCat(c)}
                >
                  <span>{c.emoji}</span>
                  {c.name}
                </button>
              ))}
              {suggested.length > 0 && (
                <>
                  <p className="cat-menu-label">Suggestions</p>
                  {suggested.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="cat-chip suggested"
                      onClick={() => pickSuggested(name)}
                    >
                      <span>{guessEmoji(name)}</span>
                      {name}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {addingCat && (
            <div className="inline-form">
              <input
                className="input"
                placeholder="Category name"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={addCategory}>
                Add
              </button>
            </div>
          )}
        </div>

        <div className="row-2">
          <div>
            <label className="field-label" htmlFor="txn-date">
              Date
            </label>
            <input
              id="txn-date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="txn-note">
              Note <span className="muted">(optional)</span>
            </label>
            <input
              id="txn-note"
              className="input"
              type="text"
              placeholder="e.g. Lunch with team"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="sheet-actions">
          {txn && (
            <button type="button" className="btn btn-danger" onClick={remove}>
              Delete
            </button>
          )}
          <button type="button" className="btn btn-primary grow" onClick={save}>
            {txn ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}
