import { chromium } from 'playwright-core'

const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:4173/'

const failures = []
const consoleErrors = []

const check = (name, cond, detail = '') => {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failures.push(name)
    console.log(`FAIL  ${name} ${detail}`)
  }
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.app', { timeout: 15000 })

check('app renders empty state', await page.getByText('No transactions yet').isVisible())
check(
  'top nav has icons + fab',
  (await page.locator('.top-nav .icon-btn').count()) >= 4 && (await page.locator('.fab').count()) === 1,
)
check('theme toggle is left of logo', await page.evaluate(() => {
  const theme = document.querySelector('.top-nav > .icon-btn')
  const brand = document.querySelector('.top-nav .brand-btn')
  return Boolean(theme && brand && theme.compareDocumentPosition(brand) & Node.DOCUMENT_POSITION_FOLLOWING)
}))
check('updates bell visible', await page.getByLabel("What's new").isVisible())
check('badge dot for unseen updates', await page.locator('.badge-dot').isVisible())

// --- updates sheet ---
await page.getByLabel("What's new").click()
await page.waitForSelector('.update-sheet', { timeout: 5000 })
check('updates sheet opens', (await page.locator('.update-row').count()) >= 1)
await page.getByLabel('Close updates').click()
await page.waitForSelector('.update-sheet', { state: 'detached' })

// --- add a transaction ---
await page.locator('.fab').click()
await page.waitForSelector('.sheet', { timeout: 5000 })
check('sheet opens', true)
check('amount input focused area visible', await page.locator('.amount-input input').isVisible())

await page.locator('.amount-input input').fill('1500')
await page.locator('.sheet .cat-grid .cat-chip').first().click()
await page.locator('#txn-note').fill('Smoke test entry')
await page.locator('.sheet-actions .btn-primary').click()
await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })

const bodyAfterAdd = await page.innerText('body')
check('transaction row appears', (await page.locator('.txn-row').count()) >= 1)
check('amount shows in summary', bodyAfterAdd.includes('1,500'))
check('note appears', bodyAfterAdd.includes('Smoke test entry'))

// --- stats via header ---
await page.getByLabel('Stats').click()
await page.waitForSelector('.kpi-grid', { timeout: 5000 })
check('stats KPIs visible', (await page.locator('.kpi').count()) === 3)
const chartSvg = await page.locator('.chart-box svg').count()
check('bar chart renders', chartSvg >= 1)

// --- transactions list via header + edit flow ---
await page.getByLabel('Transactions').click()
await page.waitForSelector('.day-group', { timeout: 5000 })
check('grouped list shows day', await page.getByText('Today').isVisible())
await page.locator('.txn-row').first().click()
await page.waitForSelector('.sheet', { timeout: 5000 })
check('edit sheet opens', await page.getByText('Edit transaction').isVisible())
await page.locator('.sheet-head .icon-btn').click()
await page.waitForSelector('.sheet', { state: 'detached' })

// --- settings via header ---
await page.getByLabel('Settings').click()
await page.waitForSelector('text=Data & backup', { timeout: 5000 })
check('export button visible', await page.getByText('Export backup (JSON)').isVisible())
check('budget field visible', await page.locator('#budget').isVisible())
check('appearance section removed', (await page.locator('text=Appearance').count()) === 0)
await page.getByLabel('Close settings').click()
await page.waitForSelector('.settings-overlay', { state: 'detached' })

// --- service worker ---
const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration()
  return Boolean(reg && (reg.active || reg.installing || reg.waiting))
})
check('service worker registered', sw)

// --- persistence across reload ---
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.app', { timeout: 15000 })
const bodyAfterReload = await page.innerText('body')
check('data survives reload', bodyAfterReload.includes('Smoke test entry'))
check(
  'badge gone after seen',
  (await page.locator('.badge-dot').count()) === 0,
)

await page.screenshot({ path: 'scripts/smoke-home.png', fullPage: true })

const realErrors = consoleErrors.filter(
  (e) => !e.includes('favicon') && !e.includes('manifest.webmanifest'),
)
check('no console/page errors', realErrors.length === 0, JSON.stringify(realErrors, null, 2))

await browser.close()

console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.join(', ')}`}`)
process.exit(failures.length === 0 ? 0 : 1)
