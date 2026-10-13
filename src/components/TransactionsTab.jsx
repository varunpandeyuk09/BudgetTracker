import { useMemo, useState } from 'react'
import { useSettings, useTransactions } from '../hooks.js'
import { dayLabel, money, monthKey, monthLabel, todayISO } from '../utils/format.js'

export default function TransactionsTab({ onEdit }) {
  const txns = useTransactions()
  const settings = useSettings()
  const currency = settings.currency
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [month, setMonth] = useState('all')

  const monthOptions = useMemo(() => {
    const set = new Set(txns.map((t) => monthKey(t.date)))
    return [...set].sort().reverse()
  }, [txns])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return txns.filter((t) => {
      if (type !== 'all' && t.type !== type) return false
      if (month !== 'all' && monthKey(t.date) !== month) return false
      if (q && !`${t.category} ${t.note || ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [txns, query, type, month])

  const groups = useMemo(() => {
    const map = new Map()
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, [])
      map.get(t.date).push(t)
    }
    return [...map.entries()]
  }, [filtered])

  const totalIn = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">History</span>
          <h2>Transactions</h2>
        </div>
        <div className="totals-mini">
          <span className="pos">+{money(totalIn, currency)}</span>
          <span className="neg">-{money(totalOut, currency)}</span>
        </div>
      </header>

      <div className="filters card">
        <input
          className="input search"
          type="search"
          placeholder="Search category or note…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-row">
          <div className="segmented">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                type="button"
                className={type === t ? 'active' : ''}
                onClick={() => setType(t)}
              >
                {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>
          <select
            className="select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Filter by month"
          >
            <option value="all">All months</option>
            <option value={monthKey(todayISO())}>{monthLabel(monthKey(todayISO()))} (current)</option>
            {monthOptions
              .filter((m) => m !== monthKey(todayISO()))
              .map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card empty small">
          <div className="empty-emoji">🔍</div>
          <h2>No transactions found</h2>
          <p>{txns.length === 0 ? 'Add your first transaction with the + button.' : 'Try changing your filters.'}</p>
        </div>
      ) : (
        groups.map(([date, items]) => {
          const dayNet = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
          return (
            <section className="day-group" key={date}>
              <div className="day-head">
                <span>{dayLabel(date)}</span>
                <span className={`day-net ${dayNet < 0 ? 'neg' : 'pos'}`}>
                  {money(dayNet, currency, { signed: true })}
                </span>
              </div>
              <ul className="txn-list card">
                {items.map((t) => (
                  <li key={t.id}>
                    <button type="button" className="txn-row" onClick={() => onEdit(t)}>
                      <span
                        className="txn-emoji"
                        style={{ background: `${t.color}22`, color: t.color }}
                      >
                        {t.emoji}
                      </span>
                      <span className="txn-info">
                        <strong>{t.category}</strong>
                        <small>{t.note || 'No note'}</small>
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
          )
        })
      )}
    </>
  )
}
