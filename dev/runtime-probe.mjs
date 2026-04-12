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

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    })
  ])
}

const EXTENSION_PATH = path.resolve('dist/chrome-mv3')
const BROWSER_PATH = findBrowserPath()
const DICT_ID = process.env.DICT_ID || 'bing'
const TEXT = process.env.LOOKUP_TEXT || 'example'
const LOOKUP_TIMEOUT_MS = Number(process.env.LOOKUP_TIMEOUT_MS || 70000)

if (!fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json'))) {
  throw new Error(`Build not found: ${EXTENSION_PATH}`)
}

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

const pageLogs = []
const swLogs = []
const events = []

function bindPage(page) {
  page.on('console', msg => {
    pageLogs.push({
      url: page.url(),
      type: msg.type(),
      text: msg.text()
    })
  })
  page.on('pageerror', error => {
    pageLogs.push({
      url: page.url(),
      type: 'pageerror',
      text: error.message
    })
  })
}

context.pages().forEach(bindPage)
context.on('page', page => {
  events.push({ type: 'page', url: page.url() })
  bindPage(page)
})
context.on('serviceworker', worker => {
  events.push({ type: 'serviceworker', url: worker.url() })
  worker.on('console', msg => {
    swLogs.push({
      type: msg.type(),
      text: msg.text()
    })
  })
})

try {
  await new Promise(resolve => setTimeout(resolve, 3000))

  let worker = context.serviceWorkers()[0]
  if (!worker) {
    worker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  }

  worker.on('console', msg => {
    swLogs.push({
      type: msg.type(),
      text: msg.text()
    })
  })

  const extensionId = worker.url().split('/')[2]
  const popup = await context.newPage()
  bindPage(popup)
  await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })
  await popup.waitForTimeout(2000)

  let queryQsPanelResult = null
  let workerInfo = null
  let createWindowProbe = null

  try {
    queryQsPanelResult = await withTimeout(
      popup.evaluate(() => chrome.runtime.sendMessage({ type: 'QUERY_QS_PANEL' })),
      5000,
      'QUERY_QS_PANEL'
    )
  } catch (err) {
    queryQsPanelResult = { error: String(err?.message || err) }
  }

  try {
    workerInfo = await worker.evaluate(() => ({
      hasWindow: typeof window !== 'undefined',
      hasSelf: typeof self !== 'undefined',
      hasChrome: typeof chrome !== 'undefined',
      hasWindowsCreate: typeof chrome?.windows?.create === 'function',
      hasTabsQuery: typeof chrome?.tabs?.query === 'function'
    }))
  } catch (err) {
    workerInfo = { error: String(err?.message || err) }
  }

  try {
    createWindowProbe = await withTimeout(
      worker.evaluate(async () => {
        try {
          const existingTabs = await chrome.tabs.query({
            url: chrome.runtime.getURL('offscreen.html')
          })
          if (existingTabs.length > 0) {
            return {
              ok: true,
              reused: true,
              tabIds: existingTabs.map(tab => tab.id)
            }
          }

          const created = await chrome.windows.create({
            url: chrome.runtime.getURL('offscreen.html'),
            type: 'popup',
            focused: false,
            width: 1,
            height: 1,
            top: 0,
            left: 0
          })

          return {
            ok: true,
            reused: false,
            windowId: created.id,
            tabs:
              created.tabs?.map(tab => ({
                id: tab.id,
                url: tab.url
              })) || []
          }
        } catch (error) {
          return {
            ok: false,
            error: String(error?.message || error)
          }
        }
      }),
      10000,
      'windows.create(offscreen)'
    )
  } catch (err) {
    createWindowProbe = { error: String(err?.message || err) }
  }

  await popup.waitForTimeout(2000)

  const beforePages = context.pages().map(page => page.url())
  const startedAt = Date.now()

  let response = null
  let error = null

  try {
    response = await withTimeout(
      popup.evaluate(
        async ({ dictId, text }) =>
          chrome.runtime.sendMessage({
            type: 'FETCH_DICT_RESULT',
            payload: {
              id: dictId,
              text,
              payload: { isPDF: false }
            }
          }),
        { dictId: DICT_ID, text: TEXT }
      ),
      LOOKUP_TIMEOUT_MS,
      'FETCH_DICT_RESULT'
    )
  } catch (err) {
    error = String(err?.message || err)
  }

  await popup.waitForTimeout(3000)

  const pageStates = []
  for (const page of context.pages()) {
    pageStates.push({
      url: page.url(),
      title: await page.title().catch(() => ''),
      hidden: await page.evaluate(() => document.hidden).catch(() => null),
      readyState: await page.evaluate(() => document.readyState).catch(() => null)
    })
  }

  console.log(
    JSON.stringify(
      {
        extensionId,
        dictId: DICT_ID,
        text: TEXT,
        queryQsPanelResult,
        workerInfo,
        createWindowProbe,
        elapsedMs: Date.now() - startedAt,
        error,
        response,
        beforePages,
        afterPages: context.pages().map(page => page.url()),
        runnerPages: context
          .pages()
          .map(page => page.url())
          .filter(url => url.includes('offscreen.html')),
        pageStates,
        events,
        swLogs,
        pageLogs: pageLogs.slice(-120)
      },
      null,
      2
    )
  )
} finally {
  await context.close()
}
