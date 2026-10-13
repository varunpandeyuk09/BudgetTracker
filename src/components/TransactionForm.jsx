import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { PALETTE, db } from '../db.js'
import { useCategories, useSettings } from '../hooks.js'
import { todayISO } from '../utils/format.js'

export default function TransactionForm({ txn, onClose }) {
  const [type, setType] = useState(txn?.type || 'expense')
  const [amount, setAmount] = useState(txn ? String(txn.amount) : '')
  const [selected, setSelected] = useState(
    txn ? { name: txn.category, emoji: txn.emoji, color: txn.color } : null,
  )
  const [date, setDate] = useState(txn?.date || todayISO())
  const [note, setNote] = useState(txn?.note || '')
  const [addingCat, setAddingCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [error, setError] = useState('')
  const settings = useSettings()
  const cats = useCategories(type) || []

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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

  const addCategory = async () => {
    const name = newCat.trim()
    if (!name) return
    const color = PALETTE[(await db.categories.count()) % PALETTE.length]
    await db.categories.add({ name, emoji: '🏷️', type, color })
    setSelected({ name, emoji: '🏷️', color })
    setNewCat('')
    setAddingCat(false)
    setError('')
  }

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
        <div className="cat-grid">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cat-chip ${selected?.name === c.name ? 'active' : ''}`}
              style={selected?.name === c.name ? { borderColor: c.color, background: `${c.color}1f` } : undefined}
              onClick={() => {
                setSelected({ name: c.name, emoji: c.emoji, color: c.color })
                setError('')
              }}
            >
              <span>{c.emoji}</span>
              {c.name}
            </button>
          ))}
          <button
            type="button"
            className="cat-chip add"
            onClick={() => setAddingCat((v) => !v)}
          >
            <span>＋</span> New
          </button>
        </div>

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
