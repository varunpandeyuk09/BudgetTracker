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

// The "More" chip opens the category dropdown, whose first item is "Other" —
// that opens the inline form. The form stays open after a failed add but
// closes after a successful one, so only open it when the input is hidden.
const openNewCat = async () => {
  const input = page.locator('.sheet .inline-form .input')
  if ((await input.count()) === 0) {
    if ((await page.locator('.sheet .cat-menu').count()) === 0) {
      await page.locator('.sheet .cat-chip.add').click()
    }
    await page.locator('.sheet .cat-menu .cat-chip.other').click()
  }
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

// ---- 3) quick pills + dropdown are shown instead of every category ----
await page.locator('.fab').click()
await page.waitForSelector('.sheet', { timeout: 5000 })
await page.locator('.sheet .segmented button', { hasText: 'Expense' }).click()
const pillCount = await page.locator('.sheet .cat-grid .cat-chip').count()
check('sheet: only quick pills before More', pillCount <= 4, `(${pillCount} chips)`)
await page.locator('.sheet .cat-chip.add').click()
await page.waitForSelector('.sheet .cat-menu', { timeout: 3000 })
check(
  'sheet: dropdown lists remaining categories',
  (await page.locator('.sheet .cat-menu .cat-chip').count()) > 3,
)
check(
  'sheet: dropdown has Other first',
  (await page.locator('.sheet .cat-menu .cat-chip').first().getAttribute('class'))?.includes(
    'other',
  ) === true,
)

// ---- 4) Settings no longer duplicates the category section ----
await page.locator('.sheet .icon-btn[aria-label="Close"]').click()
await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
await page.locator('.top-nav button[aria-label="Settings"]').click()
await page.waitForSelector('.settings-panel', { timeout: 5000 })
check(
  'settings: categories section hidden',
  (await page.locator('.settings-panel .cat-grid.compact').count()) === 0,
)

check('no console/page errors', errors.length === 0, JSON.stringify(errors, null, 2))

await browser.close()
console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.length}`}`)
process.exit(failures.length === 0 ? 0 : 1)
