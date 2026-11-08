import { useMemo, useState } from 'react'
import { Donut, DonutLegend } from './Charts.jsx'
import DailySpending from './DailySpending.jsx'
import CarrySheet from './CarrySheet.jsx'
import { useCarry, useSettings, useTransactions } from '../hooks.js'
import { DAILY_BASE } from '../utils/budget.js'
import { dayLabel, money, monthKey, monthLabel, todayISO } from '../utils/format.js'

export default function Home({ onAdd, onEdit, onNavigate }) {
  const txns = useTransactions()
  const settings = useSettings()
  const carry = useCarry()
  const [carryOpen, setCarryOpen] = useState(false)
  const currency = settings.currency
  const cur = monthKey(todayISO())

  const data = useMemo(() => {
    const list = txns || []
    let income = 0
    let expense = 0
    let balance = 0
    const byCat = new Map()
    for (const t of list) {
      balance += t.type === 'income' ? t.amount : -t.amount
      if (monthKey(t.date) !== cur) continue
      if (t.type === 'income') income += t.amount
      else {
        expense += t.amount
        const prev = byCat.get(t.category) || {
          name: t.category,
          emoji: t.emoji,
          color: t.color,
          value: 0,
        }
        prev.value += t.amount
        byCat.set(t.category, prev)
      }
    }
    const donut = [...byCat.values()].sort((a, b) => b.value - a.value)
    return { income, expense, balance, donut, recent: list.slice(0, 6), count: list.length }
  }, [txns, cur])

  const budget = Number(settings.monthlyBudget) || 0
  const carryAmt = carry.amount || 0
  const eff = budget > 0 ? Math.max(0, budget - carryAmt) : 0
  const pct = eff > 0 ? Math.min(100, Math.round((data.expense / eff) * 100)) : 0
  const left = eff - data.expense

  if (data.count === 0) {
    return (
      <>
        <Header month={cur} />
        <div className="card empty">
          <div className="empty-emoji">💸</div>
          <h2>No transactions yet</h2>
          <p>Add your first income or expense and start tracking your budget.</p>
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            Add transaction
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header month={cur} />

      <section className="card summary">
        <span className="label">Total balance</span>
        <h1 className={`big-amount ${data.balance < 0 ? 'negative' : ''}`}>
          {money(data.balance, currency)}
        </h1>
        <div className="summary-chips">
          <div className="chip income">
            <span>Income</span>
            <strong>{money(data.income, currency)}</strong>
          </div>
          <div className="chip expense">
            <span>Expense</span>
            <strong>{money(data.expense, currency)}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Monthly budget</h3>
          {eff > 0 && (
            <span className={`badge ${left < 0 ? 'danger' : pct > 80 ? 'warn' : ''}`}>{pct}% used</span>
          )}
        </div>
        {eff > 0 ? (
          <>
            <div className="progress">
              <div
                className={`progress-fill ${left < 0 ? 'over' : pct > 80 ? 'warn' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="hint">
              {left >= 0 ? (
                <>
                  <strong>{money(left, currency)}</strong> left of {money(eff, currency)}
                </>
              ) : (
                <>
                  Over by <strong>{money(-left, currency)}</strong>
                </>
              )}
              {carryAmt > 0 && (
                <>
                  {' '}
                  · incl. <strong>{money(carryAmt, currency)}</strong> carry from{' '}
                  {monthLabel(carry.from || cur).split(' ')[0]}
                </>
              )}
            </p>
            {carryAmt > 0 && (
              <button
                type="button"
                className="link carry-link"
                onClick={() => setCarryOpen(true)}
              >
                Manage carry →
              </button>
            )}
          </>
        ) : (
          <p className="hint">
            Set a monthly limit to see how much you can spend — in{' '}
            <button type="button" className="link" onClick={() => onNavigate('settings')}>
              Settings
            </button>
            .
          </p>
        )}
      </section>

      <DailySpending
        txns={txns}
        month={cur}
        target={eff > 0 ? eff / DAILY_BASE : 0}
        currency={currency}
      />

      {data.donut.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>This month&apos;s spending</h3>
          </div>
          <Donut
            data={data.donut}
            centerLabel="Spent"
            centerValue={money(data.expense, currency)}
            currency={currency}
          />
          <DonutLegend data={data.donut.slice(0, 5)} currency={currency} />
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h3>Recent activity</h3>
          <button type="button" className="link" onClick={() => onNavigate('list')}>
            See all
          </button>
        </div>
        <ul className="txn-list">
          {data.recent.map((t) => (
            <li key={t.id}>
              <button type="button" className="txn-row" onClick={() => onEdit(t)}>
                <span className="txn-emoji" style={{ background: `${t.color}22`, color: t.color }}>
                  {t.emoji}
                </span>
                <span className="txn-info">
                  <strong>{t.category}</strong>
                  <small>
                    {dayLabel(t.date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </small>
                </span>
                <span className={`txn-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {money(t.amount, currency)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {carryOpen && <CarrySheet onClose={() => setCarryOpen(false)} />}
    </>
  )
}

function Header({ month }) {
  return (
    <header className="page-head">
      <div>
        <span className="eyebrow">Overview</span>
        <h2>{monthLabel(month)}</h2>
      </div>
    </header>
  )
}
