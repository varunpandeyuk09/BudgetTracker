import { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWAUpdates() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [busy, setBusy] = useState(false)

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setHasUpdate(true)
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        registration.update().catch(() => {})
      }, 60 * 60 * 1000)
    },
  })

  const reload = useCallback(async () => {
    setBusy(true)
    const doReload = () => window.location.reload()
    // Fires when the waiting worker takes control (works even if the page
    // was not previously controlled). Fallback timer covers missed events.
    navigator.serviceWorker.addEventListener('controllerchange', doReload, {
      once: true,
    })
    try {
      await updateServiceWorker(true)
    } catch {
      // fall through to the timer below
    }
    setTimeout(doReload, 2500)
  }, [updateServiceWorker])

  const dismiss = useCallback(() => {
    setBusy(false)
    setHasUpdate(false)
  }, [])

  return { needRefresh: hasUpdate, busy, reload, dismiss }
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return false
    deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    return choice.outcome === 'accepted'
  }, [deferred])

  return { canInstall: Boolean(deferred), install }
}
