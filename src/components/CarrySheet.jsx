import { useState } from 'react'
import Icon from './Icon.jsx'
import { setSetting } from '../db.js'
import { useCarry, useSettings } from '../hooks.js'
import { addSettlement, effectiveBudget, DAILY_BASE } from '../utils/budget.js'
import { money, monthLabel, monthKey, todayISO } from '../utils/format.js'

// Manage the overage carried in from earlier months.
export default function CarrySheet({ onClose }) {
  const settings = useSettings()
  const currency = settings.currency
  const carry = useCarry()
  const budget = Number(settings.monthlyBudget) || 0
  const pending = carry.amount || 0
  const eff = effectiveBudget(budget, carry)
  const cur = monthKey(todayISO())
  const [amount, setAmount] = useState('')

  const cover = async () => {
    if (pending <= 0) return
    const amt = Math.min(pending, Number(amount) || pending)
    if (!(amt > 0)) return
    await setSetting('settlements', addSettlement(settings.settlements, cur, amt))
    onClose()
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>Manage overspending</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        {pending > 0 ? (
          <>
            <div className="carry-hero">
              <span className="label">Pending carry</span>
              <strong className="neg">{money(pending, currency)}</strong>
              <p className="hint">
                {monthLabel(carry.from || cur)} ka budget ke upar kharcha — abhi{' '}
                {monthLabel(cur).split(' ')[0]} ke budget se kat raha hai.
              </p>
            </div>

            <div className="report-row">
              <span className="row-label">This month&apos;s effective budget</span>
              <span className="row-val">{money(eff, currency)}</span>
            </div>
            <div className="report-row">
              <span className="row-label">Daily target ({DAILY_BASE} days)</span>
              <span className="row-val">{money(eff / DAILY_BASE, currency)}</span>
            </div>

            <label className="field-label" htmlFor="cover-amt">
              Option 1 — Cover from savings (instant 0)
            </label>
            <div className="inline-form">
              <input
                id="cover-amt"
                className="input"
                type="text"
                inputMode="decimal"
                placeholder={String(pending)}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={cover}>
                Cover
              </button>
            </div>
            <p className="hint">
              Poora {money(pending, currency)} cover karne ke liye amount khaali chhod do. Partial
              bhi chalega — jitna daaloge utna carry se kat jayega.
            </p>

            <label className="field-label">Option 2 — Auto-recover (free)</label>
            <p className="hint" style={{ marginTop: 0 }}>
              Kuch mat karo — is month <strong>{money(eff, currency)}</strong> se kam kharche toh{' '}
              {monthLabel(cur).split(' ')[0]} ka bacha hua carry khud cover ho jayega. Daily limit:{' '}
              <strong>{money(eff / DAILY_BASE, currency)}</strong>.
            </p>
          </>
        ) : (
          <div className="card empty small" style={{ marginBottom: 0 }}>
            <div className="empty-emoji">🎉</div>
            <h2>Nothing pending</h2>
            <p>Saare months budget ke andar hain — koi carry nahi hai.</p>
          </div>
        )}

        <div className="sheet-actions">
          <button type="button" className="btn btn-outline grow" onClick={onClose}>
            Close
          </button>
          {pending > 0 && (
            <button type="button" className="btn btn-primary grow" onClick={cover}>
              Cover {money(amount ? Number(amount) || 0 : pending, currency)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
