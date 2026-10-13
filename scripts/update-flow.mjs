import { appendFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:4173/'
const SW_FILE = 'dist/sw.js'

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

await page.waitForFunction(
  async () => {
    const r = await navigator.serviceWorker.getRegistration()
    return !!(r && r.active)
  },
  null,
  { timeout: 20000 },
)

check('no toast on fresh load', (await page.locator('.toast').count()) === 0)

// Reload so the page is controlled by the installed worker (real-world visit #2)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.app', { timeout: 15000 })
check('still no toast on second load', (await page.locator('.toast').count()) === 0)

// Simulate a new deployment: service worker script bytes change
appendFileSync(SW_FILE, `\n/* update-test ${Date.now()} */`)
await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()))

await page.waitForSelector('.toast', { timeout: 20000 })
check('toast appears only when a real update exists', true)

await page.evaluate(() => {
  window.__marker = 1
})
await page.locator('.toast button', { hasText: 'Reload' }).click()

try {
  await page.waitForFunction(() => window.__marker === undefined, null, { timeout: 15000 })
  check('Reload button actually reloads the page', true)
} catch {
  check('Reload button actually reloads the page', false, '(page never reloaded)')
}

await page.waitForSelector('.app', { timeout: 15000 })
await page.waitForTimeout(800)
check('toast gone after update', (await page.locator('.toast').count()) === 0)

const realErrors = consoleErrors.filter(
  (e) => !e.includes('favicon') && !e.includes('manifest.webmanifest'),
)
check('no console/page errors', realErrors.length === 0, JSON.stringify(realErrors, null, 2))

await browser.close()
console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.join(', ')}`}`)
process.exit(failures.length === 0 ? 0 : 1)
