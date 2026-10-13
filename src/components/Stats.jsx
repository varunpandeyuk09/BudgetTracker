import { useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import { Donut, DonutLegend, MonthBars } from './Charts.jsx'
import { useSettings, useTransactions } from '../hooks.js'
import { money, monthKey, monthLabel, monthLabelShort, shiftMonth, todayISO } from '../utils/format.js'

export default function Stats() {
  const txns = useTransactions()
  const settings = useSettings()
  const currency = settings.currency
  const list = txns
  const [month, setMonth] = useState(() => monthKey(todayISO()))

  const months = useMemo(() => {
    const set = new Set(list.map((t) => monthKey(t.date)))
    set.add(monthKey(todayISO()))
    return [...set].sort()
  }, [list])

  const earliest = months[0] || monthKey(todayISO())
  const canPrev = month > earliest
  const canNext = month < monthKey(todayISO())

  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    const byCat = new Map()
    for (const t of list) {
      if (monthKey(t.date) !== month) continue
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
    return { income, expense, net: income - expense, donut }
  }, [list, month])

  const series = useMemo(() => {
    const out = []
    for (let i = 5; i >= 0; i--) {
      const key = shiftMonth(month, -i)
      let inc = 0
      let exp = 0
      for (const t of list) {
        if (monthKey(t.date) !== key) continue
        if (t.type === 'income') inc += t.amount
        else exp += t.amount
      }
      out.push({ label: monthLabelShort(key), income: inc, expense: exp })
    }
    return out
  }, [list, month])

  const hasData = stats.income > 0 || stats.expense > 0

  return (
    <>
      <header className="page-head">
        <div>
          <span className="eyebrow">Insights</span>
          <h2>Statistics</h2>
        </div>
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            disabled={!canPrev}
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Previous month"
          >
            <Icon name="left" size={18} />
          </button>
          <span className="month-nav-label">{monthLabel(month)}</span>
          <button
            type="button"
            className="icon-btn"
            disabled={!canNext}
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Next month"
          >
            <Icon name="right" size={18} />
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="card kpi">
          <span className="label">Income</span>
          <strong className="pos">{money(stats.income, currency)}</strong>
        </div>
        <div className="card kpi">
          <span className="label">Expense</span>
          <strong className="neg">{money(stats.expense, currency)}</strong>
        </div>
        <div className="card kpi wide">
          <span className="label">Net</span>
          <strong className={stats.net < 0 ? 'neg' : 'pos'}>{money(stats.net, currency, { signed: true })}</strong>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Last 6 months</h3>
        </div>
        <MonthBars data={series} currency={currency} />
      </section>

      {hasData ? (
        <section className="card">
          <div className="card-head">
            <h3>Spending by category</h3>
          </div>
          {stats.donut.length > 0 ? (
            <>
              <Donut
                data={stats.donut}
                centerLabel="Spent"
                centerValue={money(stats.expense, currency)}
                currency={currency}
              />
              <DonutLegend data={stats.donut} currency={currency} />
            </>
          ) : (
            <p className="hint">No expenses this month — only income recorded.</p>
          )}
        </section>
      ) : (
        <div className="card empty small">
          <div className="empty-emoji">📊</div>
          <h2>Nothing here yet</h2>
          <p>No transactions in {monthLabel(month)}.</p>
        </div>
      )}
    </>
  )
}
