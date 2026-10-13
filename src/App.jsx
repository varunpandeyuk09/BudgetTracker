import { useEffect, useState } from 'react'
import Home from './components/Home.jsx'
import Stats from './components/Stats.jsx'
import TransactionsTab from './components/TransactionsTab.jsx'
import SettingsTab from './components/SettingsTab.jsx'
import TransactionForm from './components/TransactionForm.jsx'
import TabBar from './components/TabBar.jsx'
import { useInstallPrompt, usePWAUpdates } from './pwa.js'
import { useSettings } from './hooks.js'

export default function App() {
  const [tab, setTab] = useState('home')
  const [form, setForm] = useState(undefined)
  const settings = useSettings()
  const { needRefresh, busy, reload, dismiss } = usePWAUpdates()
  const { canInstall, install } = useInstallPrompt()
  const [installDismissed, setInstallDismissed] = useState(
    () => sessionStorage.getItem('install-dismissed') === '1',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme || 'dark'
  }, [settings.theme])

  const dismissInstall = () => {
    sessionStorage.setItem('install-dismissed', '1')
    setInstallDismissed(true)
  }

  const showInstall = canInstall && !installDismissed && tab !== 'settings'

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

      <main>
        {tab === 'home' && (
          <Home
            onAdd={() => setForm({ txn: null })}
            onEdit={(txn) => setForm({ txn })}
            onNavigate={setTab}
          />
        )}
        {tab === 'stats' && <Stats />}
        {tab === 'list' && <TransactionsTab onEdit={(txn) => setForm({ txn })} />}
        {tab === 'settings' && <SettingsTab />}
      </main>

      <TabBar tab={tab} onChange={setTab} onAdd={() => setForm({ txn: null })} />

      {form && <TransactionForm txn={form.txn} onClose={() => setForm(undefined)} />}

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
