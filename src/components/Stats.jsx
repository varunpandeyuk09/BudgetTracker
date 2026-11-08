import { useMemo, useState } from 'react'
import Icon from './Icon.jsx'
import { Donut, DonutLegend, MonthBars } from './Charts.jsx'
import CarrySheet from './CarrySheet.jsx'
import { useCarry, useSettings, useTransactions } from '../hooks.js'
import { expenseByMonth, effectiveBudget, DAILY_BASE } from '../utils/budget.js'
import { money, monthKey, monthLabel, monthLabelShort, shiftMonth, todayISO } from '../utils/format.js'

export default function Stats() {
  const txns = useTransactions()
  const settings = useSettings()
  const carry = useCarry()
  const currency = settings.currency
  const list = txns
  const [month, setMonth] = useState(() => monthKey(todayISO()))
  const [carryOpen, setCarryOpen] = useState(false)
  const budget = Number(settings.monthlyBudget) || 0
  const carryAmt = carry.amount || 0
  const eff = effectiveBudget(budget, carry)

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

  // Per-month budget vs spend, with overage status across history.
  const report = useMemo(() => {
    if (!(budget > 0)) return null
    const exp = expenseByMonth(list)
    const cur = monthKey(todayISO())
    const monthKeys = [...new Set([...exp.keys(), cur])].sort().reverse()
    const rows = monthKeys.map((m) => {
      const spent = exp.get(m) || 0
      const over = Math.max(0, Math.round((spent - budget) * 100) / 100)
      // Current month's overage counts as pending only if it exceeds budget;
      // past months are pending only while the carry hasn't absorbed them.
      let status = 'ok'
      if (m === cur) status = over > 0 ? 'pending' : 'ok'
      else if (carryAmt > 0 && (!carry.from || m >= carry.from)) status = 'pending'
      else if (over > 0) status = carryAmt > 0 ? 'pending' : 'recovered'
      return { month: m, spent, over, status }
    })
    return rows
  }, [list, budget, carryAmt, carry.from])

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

      {report && (
        <section className="card">
          <div className="card-head">
            <h3>Budget report</h3>
            {carryAmt > 0 && (
              <span className="badge danger">{money(carryAmt, currency)} carry</span>
            )}
          </div>
          <div className="report-row">
            <span className="row-label">Monthly budget</span>
            <span className="row-val">{money(budget, currency)}</span>
          </div>
          <div className="report-row">
            <span className="row-label">Effective this month</span>
            <span className={`row-val ${carryAmt > 0 ? 'neg' : ''}`}>
              {money(eff, currency)}
              {carryAmt > 0 && <span className="muted"> − {money(carryAmt, currency)} carry</span>}
            </span>
          </div>
          <div className="report-row">
            <span className="row-label">Daily target ({DAILY_BASE}-day base)</span>
            <span className="row-val">{money(eff / DAILY_BASE, currency)}</span>
          </div>
          <div className="report-row">
            <span className="row-label">{monthLabelShort(month)} spent</span>
            <span className={`row-val ${stats.expense > eff ? 'neg' : ''}`}>
              {money(stats.expense, currency)}
            </span>
          </div>
          <div className="report-row">
            <span className="row-label">Result</span>
            <span className={`row-val ${stats.expense > budget ? 'neg' : 'pos'}`}>
              {stats.expense > budget
                ? `Over by ${money(stats.expense - budget, currency)}`
                : `Under by ${money(budget - stats.expense, currency)}`}
            </span>
          </div>

          <p className="field-label">Over-budget history</p>
          <ul className="report-history">
            {report.map((r) => (
              <li key={r.month}>
                <span className="row-label">{monthLabelShort(r.month)}</span>
                <span className="row-val">
                  {r.over > 0 ? `+${money(r.over, currency)}` : money(0, currency)}
                </span>
                <span
                  className={`badge ${
                    r.status === 'pending' ? 'danger' : r.status === 'recovered' ? '' : 'ghost'
                  }`}
                >
                  {r.status === 'pending'
                    ? 'Pending'
                    : r.status === 'recovered'
                      ? 'Recovered'
                      : 'Within budget'}
                </span>
              </li>
            ))}
          </ul>
          <p className="hint">
            {carryAmt > 0 ? (
              <>
                <strong>{money(carryAmt, currency)}</strong> abhi agle month ke budget se kat raha
                hai —{' '}
                <button type="button" className="link" onClick={() => setCarryOpen(true)}>
                  manage karo
                </button>{' '}
                (savings se cover ya auto-recover).
              </>
            ) : (
              <>Har mahine ka over-budget alag track hota hai — wo aage jaake next month ke budget se recover hota hai.</>
            )}
          </p>
        </section>
      )}

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

      {carryOpen && <CarrySheet onClose={() => setCarryOpen(false)} />}
    </>
  )
}
