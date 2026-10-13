# Budget Tracker

A modern, offline-first budget tracker that installs on your Android phone as a PWA
(React + Vite + IndexedDB). Rebuilds and updates **never** touch your data.

## Features

- 💰 Income / expense tracking with categories, notes and dates
- 🎯 Monthly budget with a live progress bar
- 📊 Charts: spending donut by category + 6-month income vs expense bars
- 🔍 Search, filter and month views over your full history
- 🌙 Dark / light themes, multi-currency (₹ $ € £ ¥)
- 📲 Installs to your home screen, works fully offline
- ⬇️ Export / import JSON backups

## How data + updates work (the important part)

| Piece | Where it lives | What happens on update |
|---|---|---|
| Your transactions | **On your phone only**, in IndexedDB (browser database) | Untouched — code updates never see or modify it |
| The app code | This git repo → GitHub Pages | Rebuilt and redeployed on every push |

So the update cycle is:

```
edit code → git add/commit/push → GitHub Actions builds → your phone auto-offers "Reload"
```

No reinstall needed. Even if you remove and re-install the PWA from the home screen,
the data survives, because it is stored in the browser, not in the app package.
(Only clearing Chrome's "Site data" deletes it — so export a backup occasionally.)

## Install on your Android phone

1. Push this repo to GitHub and enable **Settings → Pages → Source: GitHub Actions**.
2. Open the published URL in Chrome on your phone
   (e.g. `https://<user>.github.io/<repo>/`).
3. Menu (⋮) → **Add to Home screen** → **Install**.
4. Launch it from the icon — it opens fullscreen and works offline.

## Update the app (git sync flow)

```bash
git add .
git commit -m "describe your change"
git push
```

GitHub Actions builds and deploys automatically. On the phone the app checks for a new
version hourly and shows a **"New version is ready → Reload"** toast (a plain reopen
also picks it up).

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the build locally
npm run lint     # oxlint
```

To test on your phone over Wi-Fi, run `npm run dev -- --host` and open the printed
`http://<your-pc-ip>:5173` on the phone (same network).

## Backup

**Settings → Data & backup → Export backup** downloads a JSON file with everything.
**Import backup** restores it (replaces current data). Use this before moving phones.

## Stack

- React 19 + Vite 8 + vite-plugin-pwa (Workbox service worker)
- Dexie (IndexedDB) for storage
- Recharts for charts
- Plain CSS design system (no UI framework)
