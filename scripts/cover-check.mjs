import { chromium } from 'playwright-core'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:4173/'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && !m.text().includes('favicon') && errors.push(m.text()))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.app', { timeout: 15000 })

// budget 9000
await page.getByLabel('Settings').click()
await page.waitForSelector('#budget')
await page.locator('#budget').fill('9000')
await page.getByText('Save', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByLabel('Close settings').click()
await page.waitForSelector('.settings-overlay', { state: 'detached' })

// Oct overspend -> carry 800
const addOct = async (amount, note) => {
  await page.locator('.fab').click()
  await page.waitForSelector('.sheet')
  await page.locator('.amount-input input').fill(String(amount))
  await page.locator('.sheet .cat-grid .cat-chip').first().click()
  await page.locator('#txn-note').fill(note)
  const y = new Date().getFullYear()
  const m = new Date().getMonth()
  const prev = m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, '0')}`
  await page.locator('#txn-date').fill(`${prev}-05`)
  await page.locator('.sheet-actions .btn-primary').click()
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
  await page.waitForTimeout(150)
}
await addOct(9800, 'Oct overspend')
await page.waitForTimeout(600)

const before = await page.innerText('body')
console.log('BEFORE carry shown:', before.toLowerCase().includes('carry from'))

// open carry sheet, wait for animation, screenshot settled
await page.getByText('Manage carry').click()
await page.waitForSelector('.sheet', { timeout: 5000 })
await page.waitForTimeout(600)
await page.screenshot({ path: 'scripts/feat-carry-sheet.png' })
const sheetText = await page.innerText('.sheet')
console.log('pending hero 800:', sheetText.includes('₹800'))
console.log('eff budget row 8200:', sheetText.includes('₹8,200'))

// cover full amount
await page.locator('.sheet-actions .btn-primary').click()
await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
await page.waitForTimeout(600)

const after = await page.innerText('body')
console.log('AFTER carry gone:', !after.toLowerCase().includes('carry from'))
console.log('AFTER budget back to 9000:', after.includes('₹9,000'))
console.log('AFTER daily target 300:', after.includes('₹300/day'))

await page.screenshot({ path: 'scripts/feat-after-cover.png', fullPage: true })
console.log('errors:', JSON.stringify(errors))
await browser.close()
