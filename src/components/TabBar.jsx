import Icon from './Icon.jsx'

const ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'stats', label: 'Stats', icon: 'stats' },
  { id: 'list', label: 'Transactions', icon: 'list' },
  { id: 'settings', label: 'Settings', icon: 'gear' },
]

export default function TabBar({ tab, onChange, onAdd }) {
  const item = (i, className) => (
    <button
      key={i.id}
      type="button"
      className={`tab ${className || ''} ${tab === i.id ? 'active' : ''}`}
      onClick={() => onChange(i.id)}
      aria-label={i.label}
    >
      <Icon name={i.icon} size={21} />
      <span>{i.label}</span>
    </button>
  )

  return (
    <nav className="tabbar">
      {ITEMS.slice(0, 2).map((i) => item(i))}
      <button type="button" className="fab" onClick={onAdd} aria-label="Add transaction">
        <Icon name="plus" size={26} />
      </button>
      {ITEMS.slice(2).map((i) => item(i))}
    </nav>
  )
}
