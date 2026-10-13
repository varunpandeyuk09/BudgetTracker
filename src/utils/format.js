export function money(amount, currency = '₹', { signed = false } = {}) {
  const n = Number(amount) || 0
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: abs % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })
  const sign = signed ? (n < 0 ? '-' : '+') : n < 0 ? '-' : ''
  return `${sign}${currency}${formatted}`
}

export function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function monthKey(date) {
  return String(date).slice(0, 7)
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function monthLabelShort(key) {
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short' })
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function dayLabel(date) {
  const today = todayISO()
  if (date === today) return 'Today'
  const y = new Date(Date.now() - 86400000)
  const off = y.getTimezoneOffset()
  const yesterday = new Date(y.getTime() - off * 60000).toISOString().slice(0, 10)
  if (date === yesterday) return 'Yesterday'
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
