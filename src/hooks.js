import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DEFAULT_SETTINGS, db } from './db.js'

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
