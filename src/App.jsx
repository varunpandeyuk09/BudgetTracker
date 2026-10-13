import { useEffect, useState } from 'react'
import Home from './components/Home.jsx'
import Stats from './components/Stats.jsx'
import TransactionsTab from './components/TransactionsTab.jsx'
import SettingsTab from './components/SettingsTab.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import UpdatesSheet from './components/UpdatesSheet.jsx'
import Icon from './components/Icon.jsx'
import { useInstallPrompt, usePWAUpdates } from './pwa.js'
import { useSettings } from './hooks.js'
import { setSetting } from './db.js'
import { UPDATES } from './updates.js'

const LAST_SEEN_KEY = 'bt-last-seen-update'

export default function App() {
  const [view, setView] = useState('home')
  const [form, setForm] = useState(undefined)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [updatesOpen, setUpdatesOpen] = useState(false)
  const settings = useSettings()
  const { needRefresh, busy, reload, dismiss } = usePWAUpdates()
  const { canInstall, install } = useInstallPrompt()
  const [installDismissed, setInstallDismissed] = useState(
    () => sessionStorage.getItem('install-dismissed') === '1',
  )
  const [lastSeenId, setLastSeenId] = useState(() => {
    try {
      return localStorage.getItem(LAST_SEEN_KEY) || ''
    } catch {
      return ''
    }
  })

  const theme = settings.theme || 'dark'
  const hasUnseen = UPDATES.length > 0 && UPDATES[0].id !== lastSeenId

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = () => setSetting('theme', theme === 'dark' ? 'light' : 'dark')

  const openUpdates = () => {
    setUpdatesOpen(true)
    const latest = UPDATES[0]?.id || ''
    setLastSeenId(latest)
    try {
      localStorage.setItem(LAST_SEEN_KEY, latest)
    } catch {
      // private mode — badge will reappear next time
    }
  }

  const dismissInstall = () => {
    sessionStorage.setItem('install-dismissed', '1')
    setInstallDismissed(true)
  }

  const showInstall = canInstall && !installDismissed && !settingsOpen && !updatesOpen

  return (
    <div className="app">
      {showInstall && (
        <div className="banner">
          <div>
            <strong>Install Budget Tracker</strong>
            <p>Add it to your home screen — works offline like a native app.</p>
          </div>
          <div className="banner-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                const ok = await install()
                if (ok) dismissInstall()
              }}
            >
              Install
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={dismissInstall}>
              Later
            </button>
          </div>
        </div>
      )}

      <header className="top-nav">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

        <button
          type="button"
          className="brand-btn"
          onClick={() => setView('home')}
          aria-label="Go to home"
        >
          <span className="logo">₹</span>
          <span className="brand-text">Budget Tracker</span>
        </button>

        <div className="top-nav-actions">
          <button
            type="button"
            className={`icon-btn ${view === 'stats' ? 'is-active' : ''}`}
            onClick={() => setView(view === 'stats' ? 'home' : 'stats')}
            aria-label="Stats"
          >
            <Icon name="stats" size={19} />
          </button>
          <button
            type="button"
            className={`icon-btn ${view === 'list' ? 'is-active' : ''}`}
            onClick={() => setView(view === 'list' ? 'home' : 'list')}
            aria-label="Transactions"
          >
            <Icon name="list" size={19} />
          </button>
          <button
            type="button"
            className="icon-btn bell-btn"
            onClick={openUpdates}
            aria-label="What's new"
          >
            <Icon name="bell" size={19} />
            {hasUnseen && <span className="badge-dot" />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <Icon name="gear" size={19} />
          </button>
        </div>
      </header>

      <main>
        {view === 'home' && (
          <Home
            onAdd={() => setForm({ txn: null })}
            onEdit={(txn) => setForm({ txn })}
            onNavigate={(target) => {
              if (target === 'settings') setSettingsOpen(true)
              else setView(target)
            }}
          />
        )}
        {view === 'stats' && <Stats />}
        {view === 'list' && <TransactionsTab onEdit={(txn) => setForm({ txn })} />}
      </main>

      <button type="button" className="fab" onClick={() => setForm({ txn: null })} aria-label="Add transaction">
        <Icon name="plus" size={26} />
      </button>

      {form && <TransactionForm txn={form.txn} onClose={() => setForm(undefined)} />}

      {settingsOpen && (
        <div className="settings-overlay">
          <div className="settings-panel">
            <SettingsTab
              onClose={() => setSettingsOpen(false)}
              onOpenUpdates={() => {
                setSettingsOpen(false)
                openUpdates()
              }}
            />
          </div>
        </div>
      )}

      {updatesOpen && <UpdatesSheet onClose={() => setUpdatesOpen(false)} />}

      {needRefresh && (
        <div className="toast">
          <span>🔄 New version is ready</span>
          <div className="toast-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={reload}
              disabled={busy}
            >
              {busy ? 'Updating…' : 'Reload'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
