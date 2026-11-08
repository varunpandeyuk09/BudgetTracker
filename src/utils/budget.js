import { monthKey } from './format.js'

// Daily targets always assume a 30-day month.
export const DAILY_BASE = 30

export function expenseByMonth(txns) {
  const map = new Map()
  for (const t of txns) {
    if (t.type !== 'expense') continue
    const k = monthKey(t.date)
    map.set(k, (map.get(k) || 0) + t.amount)
  }
  return map
}

export function effectiveBudget(budget, carry) {
  if (!(budget > 0)) return 0
  return Math.max(0, budget - (carry?.amount || 0))
}

const round2 = (n) => Math.round(n * 100) / 100

// Pending overage carried into `currentMonth`, derived from FULL history —
// always correct even when old months are added/edited later.
// Each closed month folds in: overspend adds, underspend recovers (never
// banks below 0). `settlements` (month -> amount covered from savings) are
// applied at the month they were recorded, against the carry entering it.
export function computeCarry(expByMonth, budget, currentMonth, settlements) {
  if (!(budget > 0)) return { amount: 0, from: null }
  const months = [
    ...new Set([...expByMonth.keys(), ...Object.keys(settlements || {})]),
  ].sort()

  let amount = 0
  let from = null
  for (const m of months) {
    if (m >= currentMonth) break
    if (settlements?.[m]) amount = round2(Math.max(0, amount - settlements[m]))
    amount = round2(Math.max(0, amount + (expByMonth.get(m) || 0) - budget))
    if (amount > 0 && !from) from = m
    else if (amount === 0) from = null
  }
  // Settlement made this month applies immediately (carry entering this month).
  if (settlements?.[currentMonth]) {
    amount = round2(Math.max(0, amount - settlements[currentMonth]))
    if (amount === 0) from = null
  }
  return { amount, from }
}

// Records a "cover from savings" payment for the current month.
export function addSettlement(settlements, month, amount) {
  const next = { ...(settlements || {}) }
  next[month] = round2((Number(next[month]) || 0) + amount)
  return next
}
