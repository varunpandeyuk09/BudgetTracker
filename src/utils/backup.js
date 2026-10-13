import { db, ensureSeeded } from '../db.js'

export async function exportBackup() {
  const data = {
    app: 'budget-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: await db.transactions.toArray(),
    categories: await db.categories.toArray(),
    settings: await db.settings.toArray(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (data.app !== 'budget-tracker' || !Array.isArray(data.transactions)) {
    throw new Error('Not a valid Budget Tracker backup file')
  }
  const ok = window.confirm(
    `Import ${data.transactions.length} transactions? This replaces all current data.`,
  )
  if (!ok) return false

  await db.transaction('rw', db.transactions, db.categories, db.settings, async () => {
    await db.transactions.clear()
    await db.categories.clear()
    await db.settings.clear()
    if (data.transactions.length) await db.transactions.bulkAdd(data.transactions)
    if (data.categories?.length) await db.categories.bulkAdd(data.categories)
    if (data.settings?.length) await db.settings.bulkPut(data.settings)
  })
  return true
}

export async function resetAllData() {
  const ok = window.confirm('Delete ALL transactions, categories and settings? This cannot be undone.')
  if (!ok) return
  await db.transaction('rw', db.transactions, db.categories, db.settings, async () => {
    await db.transactions.clear()
    await db.categories.clear()
    await db.settings.clear()
  })
  await ensureSeeded()
}
