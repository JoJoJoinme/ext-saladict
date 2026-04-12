import { chromium } from 'playwright-core'
import fs from 'fs'
import path from 'path'
import {
  centerOf,
  findBrowserPath,
  getBrowserProxyConfig,
  getTextRect,
  readLookupUi,
  waitFor
} from '../acceptance/helpers.mjs'

const EXTENSION_PATH = '/srv/work/ext-saladict/dist/chrome-mv3'
const SHOTS = '/srv/work/ext-saladict/test/e2e/manual-check'

function findSystemBrowserPath() {
  const candidates = [
    process.env.BROWSER_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

const BROWSER_PATH = findSystemBrowserPath() || findBrowserPath()

if (!fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json'))) {
  throw new Error(`Build not found: ${EXTENSION_PATH}`)
}
if (!BROWSER_PATH) {
  throw new Error('No compatible browser found for manual extension testing')
}

fs.mkdirSync(SHOTS, { recursive: true })

console.log(`Manual browser path: ${BROWSER_PATH}`)

const context = await chromium.launchPersistentContext('', {
  headless: false,
  executablePath: BROWSER_PATH,
  proxy: getBrowserProxyConfig(),
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ],
  ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
  chromiumSandbox: false,
  timeout: 30000
})

try {
  await new Promise(resolve => setTimeout(resolve, 3000))
  const sw = context
    .serviceWorkers()
    .find(w => w.url().includes('chrome-extension://'))
  const extensionId =
    sw?.url().match(/chrome-extension:\/\/([^/]+)/)?.[1] || null

  const page = await context.newPage()
  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })
  await page.waitForTimeout(3000)
  await page.bringToFront()

  const wordRect = await getTextRect(page, 'h1', 'Example')
  if (!wordRect) {
    throw new Error('Could not resolve Example text range')
  }

  await page.mouse.move(wordRect.x + 2, wordRect.y + wordRect.height / 2)
  await page.mouse.down()
  await page.mouse.move(wordRect.x + wordRect.width - 2, wordRect.y + wordRect.height / 2, {
    steps: 20
  })
  await page.mouse.up()
  await page.waitForTimeout(2500)

  const beforeClick = await readLookupUi(page)
  await page.screenshot({
    path: path.join(SHOTS, 'selection-before-click.png'),
    fullPage: true
  })

  let clicked = false
  if (beforeClick.bowlVisible && beforeClick.bowlRect) {
    const point = centerOf(beforeClick.bowlRect)
    await page.mouse.click(point.x, point.y)
    clicked = true
    await waitFor(async () => {
      const state = await readLookupUi(page)
      const bingItem = state.items.find(item => item.dictId === 'bing')
      return (
        state.panelVisible &&
        state.panelState === 'success' &&
        state.panelTerminal &&
        bingItem?.contentState === 'success' &&
        state.blankFinishedItems.length === 0 &&
        state
      )
    }, 20000)
  }

  const afterClick = await readLookupUi(page)
  await page.screenshot({
    path: path.join(SHOTS, 'selection-after-click.png'),
    fullPage: true
  })

  const passed = Boolean(
    beforeClick.bowlVisible &&
      clicked &&
      afterClick.panelVisible &&
      afterClick.panelState === 'success' &&
      afterClick.panelTerminal &&
      afterClick.items.find(item => item.dictId === 'bing')?.contentState ===
        'success' &&
      afterClick.blankFinishedItems.length === 0
  )

  console.log(
    JSON.stringify(
      {
        passed,
        extensionId,
        screenshots: {
          beforeClick: path.join(SHOTS, 'selection-before-click.png'),
          afterClick: path.join(SHOTS, 'selection-after-click.png')
        },
        beforeClick,
        clicked,
        afterClick
      },
      null,
      2
    )
  )

  if (!passed) {
    throw new Error('Manual browser check did not render dictionary results')
  }

  console.log('BROWSER_READY_FOR_MANUAL_TEST')
  if (process.env.KEEP_OPEN !== 'false') {
    await new Promise(() => {})
  }
} catch (error) {
  await context.close()
  throw error
}
