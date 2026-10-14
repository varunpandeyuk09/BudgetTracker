import { chromium } from 'playwright-core'

const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:4173/'

const failures = []
const errors = []

const check = (name, cond, detail = '') => {
  if (cond) console.log(`PASS  ${name}`)
  else {
    failures.push(name)
    console.log(`FAIL  ${name} ${detail}`)
    if (errors.length) console.log('      errors so far:', JSON.stringify(errors, null, 2))
  }
}

// The "New" chip toggles the inline form — it stays open after a failed add
// but closes after a successful one, so only click when the input is hidden.
const openNewCat = async () => {
  const input = page.locator('.sheet .inline-form .input')
  if ((await input.count()) === 0) await page.locator('.sheet .cat-chip.add').click()
  await input.waitFor({ state: 'visible', timeout: 3000 })
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.app', { timeout: 15000 })

// ---- 1) add expense category from transaction sheet (Home -> FAB) ----
await page.locator('.fab').click()
await page.waitForSelector('.sheet', { timeout: 5000 })
await openNewCat()
await page.locator('.sheet .inline-form .input').fill('Coffee')
await page.locator('.sheet .inline-form .btn-primary').click()
await page.waitForTimeout(700)
check(
  'sheet: expense category "Coffee" added',
  (await page.locator('.sheet .cat-chip', { hasText: 'Coffee' }).count()) > 0,
)

// ---- 2) add income category from same sheet ----
await page.locator('.sheet .segmented button', { hasText: 'Income' }).click()
await openNewCat()
await page.locator('.sheet .inline-form .input').fill('Bonus')
await page.locator('.sheet .inline-form .btn-primary').click()
await page.waitForTimeout(700)
check(
  'sheet: income category "Bonus" added',
  (await page.locator('.sheet .cat-chip', { hasText: 'Bonus' }).count()) > 0,
)

// new category must be usable for the transaction
await page.locator('.sheet .cat-chip', { hasText: 'Bonus' }).click()
await page.locator('.amount-input input').fill('500')
await page.locator('.sheet-actions .btn-primary').click()
await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
check(
  'transaction saved with new category',
  (await page.locator('.txn-row', { hasText: 'Bonus' }).count()) > 0,
)

// ---- 3) add category from Settings overlay ----
await page.locator('.top-nav button[aria-label="Settings"]').click()
await page.waitForSelector('.settings-panel', { timeout: 5000 })
await page.locator('.settings-panel input[placeholder="New category name"]').fill('Gym')
await page.locator('.settings-panel .inline-form.wrap .btn-primary').click()
await page.waitForTimeout(700)
check(
  'settings: category "Gym" added',
  (await page.locator('.settings-panel .cat-grid.compact .cat-chip', { hasText: 'Gym' }).count()) > 0,
)

// ---- 4) delete still works ----
const before = await page.locator('.settings-panel .cat-grid.compact .cat-chip').count()
page.once('dialog', (d) => d.accept())
await page
  .locator('.settings-panel .cat-grid.compact .cat-chip', { hasText: 'Gym' })
  .locator('.cat-remove')
  .click()
await page.waitForTimeout(500)
const after = await page.locator('.settings-panel .cat-grid.compact .cat-chip').count()
check('settings: category delete works', after === before - 1, `(${before} -> ${after})`)

check('no console/page errors', errors.length === 0, JSON.stringify(errors, null, 2))

await browser.close()
console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.length}`}`)
process.exit(failures.length === 0 ? 0 : 1)
