import { useMemo } from 'react'
import { daysInMonth, money, monthKey, todayISO } from '../utils/format.js'
import { DAILY_BASE } from '../utils/budget.js'

// Daily view for the current month — base 30 days for the daily target.
export default function DailySpending({ txns, month, target, currency }) {
  const today = todayISO()
  const dim = daysInMonth(month)
  const dayNum = Number(today.slice(8, 10))
  const isCurrent = month === monthKey(today)

  const byDay = useMemo(() => {
    const arr = Array(dim + 1).fill(0)
    for (const x of txns) {
      if (x.type !== 'expense') continue
      if (x.date.slice(0, 7) !== month) continue
      const d = Number(x.date.slice(8, 10))
      if (d >= 1 && d <= dim) arr[d] += x.amount
    }
    return arr
  }, [txns, month, dim])

  const todaySpend = isCurrent ? byDay[dayNum] || 0 : 0
  const spentSoFar = isCurrent ? byDay.slice(1, dayNum + 1).reduce((s, v) => s + v, 0) : 0
  const elapsed = isCurrent ? Math.max(1, dayNum) : dim
  const avg = spentSoFar / elapsed
  const projected = avg * DAILY_BASE
  const daysLeft = Math.max(0, dim - dayNum)
  const dailyPct = target > 0 ? Math.min(100, Math.round((todaySpend / target) * 100)) : 0
  const paceDelta = target * DAILY_BASE - projected

  const scale = Math.max(target, ...byDay) * 1.12 || 1

  return (
    <section className="card">
      <div className="card-head">
        <h3>Daily spending</h3>
        {target > 0 && <span className="badge">{money(target, currency)}/day</span>}
      </div>

      <div className="daily-row">
        <span className="label">Today</span>
        <span className="daily-amt">
          {money(todaySpend, currency)}{' '}
          <small>{target > 0 ? `of ${money(target, currency)}` : ''}</small>
        </span>
      </div>
      {target > 0 && (
        <div className="progress">
          <div
            className={`progress-fill ${todaySpend > target ? 'over' : dailyPct > 80 ? 'warn' : ''}`}
            style={{ width: `${todaySpend > target ? 100 : dailyPct}%` }}
          />
        </div>
      )}

      <div className="day-bars" aria-hidden="true">
        {byDay.slice(1).map((v, i) => {
          const day = i + 1
          const future = isCurrent && day > dayNum
          const cls = future
            ? 'future'
            : day === dayNum
              ? 'today'
              : target > 0 && v > target
                ? 'over'
                : ''
          return (
            <span
              key={day}
              className={`day-bar ${cls}`}
              style={{ height: `${future ? 6 : Math.max(4, (v / scale) * 100)}%` }}
              title={`Day ${day}: ${money(v, currency)}`}
            />
          )
        })}
      </div>
      <div className="day-axis">
        <span>1</span>
        <span>{isCurrent ? `Day ${dayNum} of ${dim}` : month}</span>
        <span>{dim}</span>
      </div>

      <div className="daily-grid">
        <div className="daily-cell">
          <span>Avg / day</span>
          <strong>{money(avg, currency)}</strong>
        </div>
        <div className="daily-cell">
          <span>Projected</span>
          <strong className={paceDelta < 0 ? 'neg' : 'pos'}>{money(projected, currency)}</strong>
        </div>
        <div className="daily-cell">
          <span>Days left</span>
          <strong>{daysLeft}</strong>
        </div>
      </div>

      {target > 0 && (
        <p className="hint">
          {paceDelta >= 0 ? (
            <>
              At this pace you&apos;ll finish at <strong>{money(projected, currency)}</strong> —{' '}
              <strong>{money(paceDelta, currency)}</strong> under budget.
            </>
          ) : (
            <>
              At this pace you&apos;ll finish at <strong>{money(projected, currency)}</strong> —{' '}
              <strong>{money(-paceDelta, currency)}</strong> over budget.
            </>
          )}
        </p>
      )}
    </section>
  )
}
