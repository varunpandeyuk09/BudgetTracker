import Dexie from 'dexie'

export const db = new Dexie('budget-tracker')

db.version(1).stores({
  transactions: '++id, date, type, category, createdAt',
  categories: 'id, type',
  settings: 'key',
})

export const DEFAULT_SETTINGS = {
  currency: '₹',
  monthlyBudget: 0,
  theme: 'dark',
}

export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Salary', emoji: '💼', type: 'income', color: '#34d399' },
  { id: 2, name: 'Freelance', emoji: '💻', type: 'income', color: '#22d3ee' },
  { id: 3, name: 'Business', emoji: '🏪', type: 'income', color: '#a78bfa' },
  { id: 4, name: 'Investment', emoji: '📈', type: 'income', color: '#60a5fa' },
  { id: 5, name: 'Gift', emoji: '🎁', type: 'income', color: '#f472b6' },
  { id: 6, name: 'Other', emoji: '💵', type: 'income', color: '#94a3b8' },

  { id: 101, name: 'Food', emoji: '🍔', type: 'expense', color: '#fb7185' },
  { id: 102, name: 'Groceries', emoji: '🛒', type: 'expense', color: '#f59e0b' },
  { id: 103, name: 'Transport', emoji: '🚕', type: 'expense', color: '#38bdf8' },
  { id: 104, name: 'Housing', emoji: '🏠', type: 'expense', color: '#a78bfa' },
  { id: 105, name: 'Utilities', emoji: '💡', type: 'expense', color: '#facc15' },
  { id: 106, name: 'Health', emoji: '🏥', type: 'expense', color: '#34d399' },
  { id: 107, name: 'Shopping', emoji: '🛍️', type: 'expense', color: '#f472b6' },
  { id: 108, name: 'Entertainment', emoji: '🎬', type: 'expense', color: '#c084fc' },
  { id: 109, name: 'Education', emoji: '📚', type: 'expense', color: '#60a5fa' },
  { id: 110, name: 'Travel', emoji: '✈️', type: 'expense', color: '#2dd4bf' },
  { id: 111, name: 'Rent', emoji: '🏘️', type: 'expense', color: '#fb923c' },
  { id: 112, name: 'Pets', emoji: '🐾', type: 'expense', color: '#fda4af' },
  { id: 113, name: 'Other', emoji: '➕', type: 'expense', color: '#94a3b8' },
]

export const PALETTE = [
  '#fb7185', '#f59e0b', '#38bdf8', '#a78bfa', '#34d399',
  '#f472b6', '#60a5fa', '#2dd4bf', '#c084fc', '#facc15',
]

export async function ensureSeeded() {
  const count = await db.categories.count()
  if (count === 0) await db.categories.bulkAdd(DEFAULT_CATEGORIES)

  const existing = await db.settings.toArray()
  const have = new Set(existing.map((s) => s.key))
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!have.has(key)) await db.settings.put({ key, value })
  }
}

// The categories table's primary key (`id`) is not auto-increment, so every
// insert must supply one — otherwise IndexedDB throws a DataError.
export async function nextCategoryId() {
  const keys = await db.categories.toCollection().primaryKeys()
  return keys.reduce((max, k) => (typeof k === 'number' && k > max ? k : max), 0) + 1
}

export async function getSetting(key) {
  const row = await db.settings.get(key)
  return row ? row.value : DEFAULT_SETTINGS[key]
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}
