import { chromium } from 'playwright-core'
import fs from 'fs'
import path from 'path'
import { getBrowserProxyConfig } from '../test/acceptance/helpers.mjs'

function findBrowserPath() {
  const playwrightDir = path.join(
    process.env.HOME || '/root',
    '.cache',
    'ms-playwright'
  )
  if (!fs.existsSync(playwrightDir)) return null

  const dirs = fs
    .readdirSync(playwrightDir)
    .filter(d => d.startsWith('chromium-'))
    .sort()
    .reverse()

  for (const dir of dirs) {
    const linux64 = path.join(playwrightDir, dir, 'chrome-linux64', 'chrome')
    const linux = path.join(playwrightDir, dir, 'chrome-linux', 'chrome')
    if (fs.existsSync(linux64)) return linux64
    if (fs.existsSync(linux)) return linux
  }

  return null
}

const EXTENSION_PATH = path.resolve('dist/chrome-mv3')
const BROWSER_PATH = findBrowserPath()

if (!BROWSER_PATH) {
  throw new Error('Chrome for Testing not found')
}

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

const page = await context.newPage()
const logs = []
const requestFailures = []
const badResponses = []

page.on('console', msg => {
  logs.push({
    type: msg.type(),
    text: msg.text()
  })
})

page.on('pageerror', error => {
  logs.push({
    type: 'pageerror',
    text: error.message,
    stack: error.stack
  })
})

page.on('requestfailed', request => {
  requestFailures.push({
    url: request.url(),
    resourceType: request.resourceType(),
    errorText: request.failure()?.errorText || ''
  })
})

page.on('response', response => {
  if (response.status() >= 400) {
    badResponses.push({
      url: response.url(),
      resourceType: response.request().resourceType(),
      status: response.status(),
      statusText: response.statusText()
    })
  }
})

try {
  await new Promise(resolve => setTimeout(resolve, 3000))
  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })
  await page.waitForTimeout(3000)

  const box = await page.locator('h1').boundingBox()
  if (!box) throw new Error('Could not resolve h1 bounding box')

  await page.mouse.move(box.x + 10, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2, {
    steps: 20
  })
  await page.mouse.up()
  await page.waitForTimeout(2500)

  const bowlRect = await page.evaluate(() => {
    const bowlHost = document.getElementById('saladict-saladbowl-root')
    const bowlRoot =
      bowlHost?.shadowRoot || bowlHost?.firstElementChild?.shadowRoot || null
    const bowl = bowlRoot?.querySelector('.saladbowl')
    return bowl ? bowl.getBoundingClientRect().toJSON() : null
  })

  if (!bowlRect) {
    throw new Error('SaladBowl not found')
  }

  await page.mouse.click(
    bowlRect.x + bowlRect.width / 2,
    bowlRect.y + bowlRect.height / 2
  )
  await page.waitForTimeout(8000)

  const dump = await page.evaluate(() => {
    const deepQueryAll = (root, selector, acc = []) => {
      if (!root) return acc

      if (root.querySelectorAll) {
        acc.push(...Array.from(root.querySelectorAll(selector)))
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
      let current = walker.currentNode

      while (current) {
        if (current.shadowRoot) {
          deepQueryAll(current.shadowRoot, selector, acc)
        }
        current = walker.nextNode()
      }

      return acc
    }

    const panelHost = document.getElementById('saladict-dictpanel-root')
    const panelRoot =
      panelHost?.shadowRoot || panelHost?.firstElementChild?.shadowRoot || null

    const dictItems = deepQueryAll(panelRoot, '.dictItem').map(item => {
      const title = item.querySelector('.dictItemHead-Title')?.textContent?.trim()
      const body = item.querySelector('.dictItem-Body')
      const measure = item.querySelector('.dictItem-BodyMesure')
      const bodyRoot = item.querySelector('.dictRoot')
      const emptyState = item.querySelector('.dictItem-EmptyState')
      return {
        title,
        className: item.className,
        bodyHeight: body instanceof HTMLElement ? body.style.height : null,
        measureHeight:
          measure instanceof HTMLElement ? measure.offsetHeight : null,
        bodyText: bodyRoot?.textContent?.trim().slice(0, 400) || '',
        emptyText: emptyState?.textContent?.trim() || '',
        hasFoldMask: !!item.querySelector('.dictItem-FoldMask'),
        hasLoader: !!item.querySelector('.dictItemHead-Loader')
      }
    })

    return {
      selection: window.getSelection()?.toString() || '',
      panelInnerHTML: panelRoot?.innerHTML?.slice(0, 12000) || '',
      dictItems,
      dictRoots: deepQueryAll(panelRoot, '.dictRoot').map(el => ({
        className: el.className,
        text: el.textContent?.slice(0, 800) || ''
      })),
      errorText: deepQueryAll(panelRoot, 'p')
        .map(el => el.textContent?.trim())
        .filter(Boolean),
      sentenceItems: deepQueryAll(panelRoot, '.dictBing-SentenceItem')
        .map(el => el.textContent?.trim())
        .filter(Boolean),
      headTitles: deepQueryAll(panelRoot, '.dictItemHead-Title').map(
        el => el.textContent?.trim()
      ),
      allText: panelRoot?.textContent?.slice(0, 4000) || ''
    }
  })

  console.log(
    JSON.stringify(
      {
        logs,
        requestFailures,
        badResponses,
        dump
      },
      null,
      2
    )
  )
} finally {
  await context.close()
}
