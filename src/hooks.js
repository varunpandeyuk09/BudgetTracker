import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_SETTINGS, db } from './db.js'
import { computeCarry, expenseByMonth } from './utils/budget.js'
import { monthKey, todayISO } from './utils/format.js'

export function useSettings() {
  const rows = useLiveQuery(() => db.settings.toArray(), [])
  return useMemo(() => {
    const map = { ...DEFAULT_SETTINGS }
    if (rows) for (const r of rows) map[r.key] = r.value
    return map
  }, [rows])
}

export function useCategories(type) {
  return useLiveQuery(
    () => (type ? db.categories.where('type').equals(type).toArray() : db.categories.toArray()),
    [type],
  )
}

export const EMPTY_LIST = []

export function useTransactions() {
  return useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) || EMPTY_LIST
}

// Pending overage from earlier months — derived from full history each time.
export function useCarry() {
  const settings = useSettings()
  const txns = useTransactions()
  const budget = Number(settings.monthlyBudget) || 0
  const settlements = settings.settlements ?? null

  return useMemo(
    () => computeCarry(expenseByMonth(txns), budget, monthKey(todayISO()), settlements),
    [txns, budget, settlements],
  )
}
