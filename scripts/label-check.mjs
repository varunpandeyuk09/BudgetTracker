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

const addTxn = async (type, amount, note, dayOffset = 0) => {
  await page.locator('.fab').click()
  await page.waitForSelector('.sheet')
  await page.waitForTimeout(400) // let the sheet animation settle
  await page.locator('.sheet .amount-input input').fill(String(amount))
  const incBtn = page.locator('.sheet .segmented.full button', { hasText: 'Income' })
  if (type === 'income') {
    await incBtn.click()
    await page.waitForTimeout(200)
  }
  await page.locator('.sheet .cat-grid .cat-chip').first().click()
  await page.locator('#txn-note').fill(note)
  if (dayOffset > 0) {
    const d = new Date()
    d.setDate(d.getDate() - dayOffset)
    await page.locator('#txn-date').fill(d.toISOString().slice(0, 10))
  }
  await page.locator('.sheet-actions .btn-primary').click()
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
  await page.waitForTimeout(150)
}

await addTxn('expense', 500, 'Groceries')
await addTxn('expense', 300, 'Auto')
await addTxn('income', 5000, 'Freelance', 15) // last month -> lifetime != this month
await page.waitForTimeout(500)

const text = await page.innerText('body')
console.log('all-time label:', text.toLowerCase().includes('total balance · all-time'))
console.log('hint lifetime:', text.toLowerCase().includes('lifetime total'))
console.log('chips month-tagged:', text.includes('Expense · Nov'))
await page.screenshot({ path: 'scripts/label-check.png', fullPage: true })
console.log('errors:', JSON.stringify(errors))
await browser.close()
