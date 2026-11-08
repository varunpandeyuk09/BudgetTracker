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

// set budget 9000
await page.getByLabel('Settings').click()
await page.waitForSelector('#budget')
await page.locator('#budget').fill('9000')
await page.getByText('Save', { exact: true }).click()
await page.waitForTimeout(300)
await page.getByLabel('Close settings').click()
await page.waitForSelector('.settings-overlay', { state: 'detached' })

const addTxn = async (amount, note, dayOffset = 0) => {
  await page.locator('.fab').click()
  await page.waitForSelector('.sheet')
  await page.locator('.amount-input input').fill(String(amount))
  await page.locator('.sheet .cat-grid .cat-chip').first().click()
  await page.locator('#txn-note').fill(note)
  if (dayOffset > 0) {
    const d = new Date()
    d.setDate(d.getDate() - dayOffset)
    const iso = d.toISOString().slice(0, 10)
    await page.locator('#txn-date').fill(iso)
  }
  await page.locator('.sheet-actions .btn-primary').click()
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
  await page.waitForTimeout(150)
}

await addTxn(4585, 'Rent')
await addTxn(1000, 'Gym')
await addTxn(450, 'Gas', 2)
await addTxn(500, 'Movie', 4)
await addTxn(52, 'Eggs and dhai')

// past month: add a salary + overspend for October report
const addOct = async (amount, note) => {
  await page.locator('.fab').click()
  await page.waitForSelector('.sheet')
  await page.locator('.amount-input input').fill(String(amount))
  await page.locator('.sheet .cat-grid .cat-chip').first().click()
  await page.locator('#txn-note').fill(note)
  const y = new Date().getFullYear()
  const m = new Date().getMonth() // current month index
  const prev = m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, '0')}`
  await page.locator('#txn-date').fill(`${prev}-05`)
  await page.locator('.sheet-actions .btn-primary').click()
  await page.waitForSelector('.sheet', { state: 'detached', timeout: 5000 })
  await page.waitForTimeout(150)
}
await addOct(9800, 'Oct overspend')

await page.waitForTimeout(600)
await page.screenshot({ path: 'scripts/feat-home.png', fullPage: true })

const homeText = await page.innerText('body')
console.log('Daily spending card:', homeText.includes('Daily spending'))
console.log('Today row:', homeText.includes('Today'))
console.log('Avg / day:', homeText.toLowerCase().includes('avg / day'))
console.log('Projected:', homeText.toLowerCase().includes('projected'))
console.log('Days left:', homeText.toLowerCase().includes('days left'))
console.log('carry link:', homeText.includes('Manage carry'))

// open carry sheet
if (homeText.includes('Manage carry')) {
  await page.getByText('Manage carry').click()
  await page.waitForSelector('.sheet', { timeout: 5000 })
  const sheetText = await page.innerText('.sheet')
  console.log('carry sheet title:', sheetText.includes('Manage overspending'))
  console.log('cover option:', sheetText.toLowerCase().includes('cover from savings'))
  console.log('auto-recover option:', sheetText.toLowerCase().includes('auto-recover'))
  await page.screenshot({ path: 'scripts/feat-carry-sheet.png' })
  await page.getByLabel('Close').click()
  await page.waitForSelector('.sheet', { state: 'detached' })
}

// stats report
await page.getByLabel('Stats').click()
await page.waitForSelector('.kpi-grid', { timeout: 5000 })
const statsText = await page.innerText('body')
console.log('Budget report:', statsText.includes('Budget report'))
console.log('Effective this month:', statsText.includes('Effective this month'))
console.log('Daily target:', statsText.includes('Daily target'))
console.log('Over-budget history:', statsText.toLowerCase().includes('over-budget history'))
console.log('Pending badge:', statsText.includes('Pending'))
console.log('Over by:', statsText.toLowerCase().includes('over by'))
await page.screenshot({ path: 'scripts/feat-stats.png', fullPage: true })

console.log('errors:', JSON.stringify(errors))
await browser.close()

