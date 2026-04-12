import { chromium } from 'playwright-core'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  clickDeep,
  centerOf,
  findBrowserPath,
  getDeepRect,
  getTextRect,
  readLookupUi,
  waitFor
} from './helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSION_PATH = path.resolve(__dirname, '../../dist/chrome-mv3')
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')
const SPEC_PATH = path.resolve(__dirname, 'spec.json')
const ARTIFACTS_DIR = path.resolve(__dirname, 'artifacts')
const BROWSER_PATH = process.env.BROWSER_PATH || findBrowserPath()
const SCENARIOS = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8')).filter(
  scenario => !scenario.runner || scenario.runner === 'acceptance'
)
const ACCEPTANCE_RUNTIME_PAYLOAD = {
  selectedDicts: ['bing'],
  waveform: false,
  stickyFold: false,
  mtaAutoUnfold: 'hide',
  config: {
    animation: false,
    bowlHover: false,
    analytics: false,
    updateCheck: false,
    searchHistory: true,
    searchHistoryInco: true,
    searchSuggests: false,
    editOnFav: false,
    defaultPinned: false,
    ctxTrans: {
      google: false,
      youdaotrans: false,
      baidu: false,
      tencent: false,
      caiyun: false,
      sogou: false
    }
  }
}

function mergeAcceptanceRuntimePayload(runtime = {}) {
  return {
    ...ACCEPTANCE_RUNTIME_PAYLOAD,
    ...runtime,
    config: {
      ...ACCEPTANCE_RUNTIME_PAYLOAD.config,
      ...(runtime.config || {}),
      ctxTrans: {
        ...ACCEPTANCE_RUNTIME_PAYLOAD.config.ctxTrans,
        ...(runtime.config?.ctxTrans || {})
      }
    }
  }
}

function deriveAcceptanceMock(step) {
  const query = step.word || step.query || step.expectedSelection
  if (!query) {
    return null
  }

  if (step.googleFixture) {
    return null
  }

  if (step.bingFixture === null) {
    return {
      dictId: 'bing',
      query,
      state: 'error'
    }
  }

  if (step.bingFixture === 'bing-empty.html') {
    return {
      dictId: 'bing',
      query,
      state: 'empty'
    }
  }

  if (step.bingFixture === 'bing-success.html') {
    return {
      dictId: 'bing',
      query,
      state: 'success'
    }
  }

  return null
}

const results = []

function pass(name, detail) {
  results.push({ name, status: 'PASS' })
  console.log(`  ✓ ${name}${detail ? ` (${detail})` : ''}`)
}

function fail(name, err) {
  results.push({ name, status: 'FAIL', error: String(err?.message || err) })
  console.log(`  ✗ ${name}: ${err?.message || err}`)
}

function printSummary() {
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  console.log('\n==================================')
  console.log(`Acceptance: ${passed} passed, ${failed} failed, ${results.length} total`)
  if (failed > 0) {
    console.log('\nFailed:')
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => console.log(`  ✗ ${r.name}: ${r.error}`))
  } else {
    console.log('\nAll acceptance scenarios passed!')
  }
  return failed
}

async function createFixtureServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const pathname = url.pathname === '/' ? '/lookup-page.html' : url.pathname
    const filePath = path.join(FIXTURES_DIR, pathname.replace(/^\/+/, ''))

    if (!filePath.startsWith(FIXTURES_DIR) || !fs.existsSync(filePath)) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('not found')
      return
    }

    const ext = path.extname(filePath)
    const contentType =
      ext === '.html' ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8'
    res.writeHead(200, { 'content-type': contentType })
    res.end(fs.readFileSync(filePath))
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start fixture server')
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  }
}

async function waitForExtensionId(context) {
  const sw = await waitFor(async () => {
    const serviceWorker = context
      .serviceWorkers()
      .find(worker => worker.url().startsWith('chrome-extension://'))
    return serviceWorker || null
  }, 15000, 500)

  if (!sw) {
    throw new Error('Extension service worker was not detected')
  }

  const extensionId = sw.url().match(/chrome-extension:\/\/([^/]+)/)?.[1]
  if (!extensionId) {
    throw new Error(`Could not parse extension ID from ${sw.url()}`)
  }

  return extensionId
}

async function configureAcceptanceRuntime(context, extensionId, runtimePayload) {
  const pagePrefix = `chrome-extension://${extensionId}/`
  const existingPage = await waitFor(async () => {
    const pages = context
      .pages()
      .filter(page => !page.isClosed() && page.url().startsWith(pagePrefix))
    return pages.find(page => page.url().includes('/options.html')) || pages[0] || null
  }, 5000, 250)

  if (existingPage) {
    await existingPage
      .waitForLoadState('domcontentloaded', { timeout: 15000 })
      .catch(() => {})
    const response = await existingPage.evaluate(async payload => {
      return await chrome.runtime.sendMessage({
        type: 'TEST_CONFIGURE_ACCEPTANCE_RUNTIME',
        payload
      })
    }, runtimePayload)
    const missingDicts = (runtimePayload.selectedDicts || []).filter(
      id => !response?.selectedDicts?.includes(id)
    )
    if (missingDicts.length > 0) {
      throw new Error(
        `Acceptance runtime config failed: ${JSON.stringify(response || null)}`
      )
    }
    return
  }

  let lastError = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    const page = await context.newPage()
    try {
      await page.goto(`chrome-extension://${extensionId}/options.html?nopanel=true`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })
      const response = await page.evaluate(async payload => {
        return await chrome.runtime.sendMessage({
          type: 'TEST_CONFIGURE_ACCEPTANCE_RUNTIME',
          payload
        })
      }, runtimePayload)
      const missingDicts = (runtimePayload.selectedDicts || []).filter(
        id => !response?.selectedDicts?.includes(id)
      )
      if (missingDicts.length > 0) {
        throw new Error(
          `Acceptance runtime config failed: ${JSON.stringify(response || null)}`
        )
      }
      await page.close().catch(() => {})
      return
    } catch (error) {
      lastError = error
      await page.close().catch(() => {})
      await new Promise(resolve => setTimeout(resolve, attempt * 500))
    }
  }

  throw lastError || new Error('Failed to configure acceptance runtime')
}

async function installNetworkFixtures(context, baseUrl, routeState) {
  await context.route('**/*', async route => {
    const currentStep = routeState.current
    const url = new URL(route.request().url())

    if (url.protocol === 'chrome-extension:') {
      await route.continue()
      return
    }

    if (url.origin === baseUrl) {
      await route.continue()
      return
    }

    if (!/^https?:$/.test(url.protocol)) {
      await route.continue()
      return
    }

    if (!currentStep) {
      await route.continue()
      return
    }

    const bingFixturePath = currentStep.bingFixture
      ? path.join(FIXTURES_DIR, currentStep.bingFixture)
      : null
    const googleFixturePath = currentStep.googleFixture
      ? path.join(FIXTURES_DIR, currentStep.googleFixture)
      : null

    if (
      url.hostname === 'cn.bing.com' &&
      url.pathname === '/dict/clientsearch' &&
      url.searchParams.get('q')?.trim().toLowerCase() ===
        currentStep.lookupText.trim().toLowerCase()
    ) {
      if (!bingFixturePath) {
        await route.abort('internetdisconnected')
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: fs.readFileSync(bingFixturePath, 'utf8')
      })
      return
    }

    if (
      url.hostname === 'translate.googleapis.com' &&
      url.pathname === '/translate_a/single' &&
      url.searchParams.get('q') === currentStep.lookupText
    ) {
      if (!googleFixturePath) {
        await route.abort('internetdisconnected')
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: fs.readFileSync(googleFixturePath, 'utf8')
      })
      return
    }

    if (
      /^translate\.google\.(com|cn)$/.test(url.hostname) &&
      (url.pathname === '/' || url.pathname === '')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<html><body>tkk:\'0\'</body></html>'
      })
      return
    }

    await route.abort('failed')
  })
}

async function withExtensionPage(context, extensionId, task) {
  const pagePrefix = `chrome-extension://${extensionId}/`
  let page = context
    .pages()
    .find(existing => !existing.isClosed() && existing.url().startsWith(pagePrefix))
  const created = !page

  if (!page) {
    page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/options.html?nopanel=true`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    })
  } else {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(
      () => {}
    )
  }

  try {
    return await task(page)
  } finally {
    if (created) {
      await page.close().catch(() => {})
    }
  }
}

async function getWordsByText(context, extensionId, area, text) {
  return withExtensionPage(context, extensionId, page =>
    page.evaluate(
      async ({ area: dbArea, text: lookupText }) => {
        return await chrome.runtime.sendMessage({
          type: 'GET_WORDS_BY_TEXT',
          payload: {
            area: dbArea,
            text: lookupText
          }
        })
      },
      { area, text }
    )
  )
}

function describeStep(step) {
  switch (step.action) {
    case 'lookup':
      return `lookup "${step.expectedSelection || step.word}"`
    case 'search':
      return `search "${step.query}"`
    case 'addToNotebook':
      return 'add to notebook'
    case 'historyBack':
      return 'history back'
    case 'historyForward':
      return 'history forward'
    case 'closePanel':
      return 'close panel'
    default:
      return step.action
  }
}

function setRouteForStep(routeState, step) {
  const lookupText = step.word || step.query || step.expectedSelection
  routeState.current = lookupText
    ? {
        lookupText,
        bingFixture: step.bingFixture ?? null,
        googleFixture: step.googleFixture ?? null
      }
    : null
}

function matchesStepExpectation(ui, step) {
  if (
    step.expectedPanelVisible != null &&
    ui.panelVisible !== step.expectedPanelVisible
  ) {
    return false
  }

  if (
    step.expectedBowlVisible != null &&
    ui.bowlVisible !== step.expectedBowlVisible
  ) {
    return false
  }

  if (step.expectedSelection && ui.selection !== step.expectedSelection) {
    return false
  }

  if (step.expectedQueryText && ui.queryText !== step.expectedQueryText) {
    return false
  }

  if (step.expectedFavActive != null && ui.favActive !== step.expectedFavActive) {
    return false
  }

  if (
    step.expectedHistoryBackDisabled != null &&
    ui.historyBackDisabled !== step.expectedHistoryBackDisabled
  ) {
    return false
  }

  if (
    step.expectedHistoryForwardDisabled != null &&
    ui.historyForwardDisabled !== step.expectedHistoryForwardDisabled
  ) {
    return false
  }

  if (step.expectedPanelState) {
    const targetItem = step.expectedDictId
      ? ui.items.find(item => item.dictId === step.expectedDictId)
      : ui.items.find(item => item.dictId === 'bing') || ui.items[0]
    if (
      !ui.panelVisible ||
      !ui.panelTerminal ||
      ui.panelState !== step.expectedPanelState ||
      targetItem?.contentState !== step.expectedItemState ||
      ui.blankFinishedItems.length > 0
    ) {
      return false
    }
  }

  return true
}

async function waitForStepExpectation(page, step) {
  return waitFor(async () => {
    const ui = await readLookupUi(page)
    return matchesStepExpectation(ui, step) ? ui : null
  }, step.action === 'closePanel' ? 10000 : 20000)
}

async function selectLookupTextFromFixture(page, step) {
  if (step.word) {
    const wordRect = await getTextRect(page, `#${step.targetId}`, step.word)
    if (!wordRect) {
      throw new Error(`Could not resolve text range for ${step.word}`)
    }

    await page.mouse.move(wordRect.x + 2, wordRect.y + wordRect.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      wordRect.x + wordRect.width - 2,
      wordRect.y + wordRect.height / 2,
      { steps: 20 }
    )
    await page.mouse.up()
  } else {
    const startRect = await getTextRect(
      page,
      `#${step.targetId}`,
      step.rangeStartWord
    )
    const endRect = await getTextRect(page, `#${step.targetId}`, step.rangeEndWord)

    if (!startRect || !endRect) {
      throw new Error(
        `Could not resolve range lookup text: ${step.rangeStartWord} -> ${step.rangeEndWord}`
      )
    }

    const startX = startRect.left + (step.rangeStartInset ?? 2)
    const endX =
      step.rangeEndFrom === 'left'
        ? endRect.left + (step.rangeEndInset ?? 2)
        : endRect.right - (step.rangeEndInset ?? 2)

    await page.mouse.move(startX, startRect.top + startRect.height / 2)
    await page.mouse.down()
    await page.mouse.move(endX, endRect.top + endRect.height / 2, {
      steps: 40
    })
    await page.mouse.up()
  }

  const activationState = await waitFor(async () => {
    const ui = await readLookupUi(page)
    const expectedSelection = step.expectedSelection || step.word
    if (expectedSelection && ui.selection !== expectedSelection) {
      return null
    }

    if (ui.bowlVisible && ui.bowlRect) {
      return { mode: 'bowl', ui }
    }

    if (ui.panelVisible) {
      return { mode: 'panel', ui }
    }

    return null
  }, 10000)

  if (!activationState) {
    throw new Error(`Lookup trigger did not activate for "${word}"`)
  }

  if (activationState.mode === 'bowl') {
    const point = centerOf(activationState.ui.bowlRect)
    await page.mouse.click(point.x, point.y)
  }
}

async function runLookupStep(page, step, routeState) {
  setRouteForStep(routeState, step)
  await selectLookupTextFromFixture(page, step)
  return waitForStepExpectation(page, step)
}

async function runSearchStep(page, step, routeState) {
  setRouteForStep(routeState, step)

  const inputRect = await getDeepRect(page, '[data-testid="lookup-search-input"]')
  if (!inputRect) {
    throw new Error('Lookup search input was not found')
  }

  const point = centerOf(inputRect)
  await page.mouse.click(point.x, point.y)
  await page.waitForTimeout(100)
  await page.keyboard.press('Control+A')
  await page.keyboard.type(step.query)
  await page.keyboard.press('Enter')

  return waitForStepExpectation(page, step)
}

async function runAddToNotebookStep(page, step, context, extensionId, routeState) {
  routeState.current = null
  const clicked = await clickDeep(page, '[data-testid="lookup-fav-button"]')
  if (!clicked) {
    throw new Error('Lookup notebook button was not found')
  }

  const finalState = await waitForStepExpectation(page, step)
  if (!finalState) {
    return null
  }

  const savedText = step.expectedSavedText || finalState.queryText || finalState.selection
  const records = await waitFor(async () => {
    const words = await getWordsByText(context, extensionId, 'notebook', savedText)
    return Array.isArray(words) && words.length > 0 ? words : null
  }, 10000)

  if (!records) {
    throw new Error(`Notebook record was not saved for "${savedText}"`)
  }

  return finalState
}

async function runHistoryStep(page, step, routeState, selector) {
  setRouteForStep(routeState, step)
  const clicked = await clickDeep(page, selector)
  if (!clicked) {
    throw new Error(`History control was not found: ${selector}`)
  }

  return waitForStepExpectation(page, step)
}

async function runClosePanelStep(page, step, routeState) {
  routeState.current = null
  const clicked = await clickDeep(page, '[data-testid="lookup-close-button"]')
  if (!clicked) {
    throw new Error('Lookup close button was not found')
  }

  return waitForStepExpectation(page, step)
}

async function closeOpenPages(context) {
  const pages = context.pages()
  for (let i = 0; i < pages.length - 1; i++) {
    await pages[i].close().catch(() => {})
  }

  const [lastPage] = context.pages()
  if (lastPage && lastPage.url() !== 'about:blank') {
    await lastPage.goto('about:blank').catch(() => {})
  }
}

async function runScenario(context, extensionId, baseUrl, scenario, routeState) {
  const shotPath = path.join(ARTIFACTS_DIR, `${scenario.id}.png`)
  let page

  try {
    page = await context.newPage()
    await page.goto(`${baseUrl}/lookup-page.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    })
    await page.waitForTimeout(1000)

    let finalState = null
    for (const [index, step] of scenario.steps.entries()) {
      console.log(`  step ${index + 1}: ${describeStep(step)}`)

      await configureAcceptanceRuntime(
        context,
        extensionId,
        mergeAcceptanceRuntimePayload({
          ...scenario.runtime,
          acceptanceMock: deriveAcceptanceMock(step)
        })
      )

      if (step.action === 'lookup') {
        finalState = await runLookupStep(page, step, routeState)
      } else if (step.action === 'search') {
        finalState = await runSearchStep(page, step, routeState)
      } else if (step.action === 'addToNotebook') {
        finalState = await runAddToNotebookStep(
          page,
          step,
          context,
          extensionId,
          routeState
        )
      } else if (step.action === 'historyBack') {
        finalState = await runHistoryStep(
          page,
          step,
          routeState,
          '[data-testid="lookup-history-back"]'
        )
      } else if (step.action === 'historyForward') {
        finalState = await runHistoryStep(
          page,
          step,
          routeState,
          '[data-testid="lookup-history-forward"]'
        )
      } else if (step.action === 'closePanel') {
        finalState = await runClosePanelStep(page, step, routeState)
      } else {
        throw new Error(`Unsupported acceptance step: ${step.action}`)
      }

      if (!finalState) {
        const ui = await readLookupUi(page)
        throw new Error(
          `Acceptance step failed: ${JSON.stringify({
            scenario: scenario.id,
            step: index + 1,
            action: step.action,
            expected: step,
            ui
          })}`
        )
      }
    }

    await page.screenshot({ path: shotPath, fullPage: true })

    const detail = finalState.panelVisible
      ? `${finalState.panelState}, query="${finalState.queryText || finalState.selection}"`
      : 'panel closed'
    pass(scenario.id, detail)
  } catch (error) {
    fail(scenario.id, error)
  } finally {
    routeState.current = null
    if (page) {
      await page.close().catch(() => {})
    }
  }
}

async function main() {
  console.log('Saladict user-intent acceptance tests')
  console.log('=====================================\n')

  if (!fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json'))) {
    console.error('ERROR: Build not found at', EXTENSION_PATH)
    process.exit(1)
  }
  if (!BROWSER_PATH || !fs.existsSync(BROWSER_PATH)) {
    console.error('ERROR: Chrome for Testing not found.')
    console.error('Run: npx playwright install chromium')
    process.exit(1)
  }

  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
  const { server, baseUrl } = await createFixtureServer()
  const userDataDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'saladict-acceptance-')
  )
  const routeState = { current: null }
  let context

  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      executablePath: BROWSER_PATH,
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

    const extensionId = await waitForExtensionId(context)
    await closeOpenPages(context)
    await installNetworkFixtures(context, baseUrl, routeState)

    for (const scenario of SCENARIOS) {
      console.log(`Scenario: ${scenario.id}`)
      console.log(`  intent: ${scenario.intent}`)
      await runScenario(context, extensionId, baseUrl, scenario, routeState)
      console.log('')
    }
  } finally {
    if (context) {
      await context.close()
    }
    fs.rmSync(userDataDir, { recursive: true, force: true })
    await new Promise(resolve => server.close(resolve))
  }

  const failed = printSummary()
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
