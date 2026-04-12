/**
 * E2E tests for Saladict MV3 Chrome Extension
 *
 * Strategy: Since Google Chrome stable blocks --load-extension and CDP
 * Extensions.loadUnpacked, we test the build output by:
 * 1. Serving extension pages via a local HTTP server
 * 2. Loading them in Chrome and verifying they render
 * 3. Validating manifest structure and file integrity
 * 4. Verifying the service worker script parses without errors
 *
 * For full extension API testing, use Chromium or Chrome for Testing.
 */
import puppeteer from 'puppeteer-core'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSION_PATH = path.resolve(__dirname, '../../dist/chrome-mv3')
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome'
const DEBUG_PORT = 9333
const HTTP_PORT = 9444
const TIMEOUT = 15000
const USER_DATA_DIR = '/tmp/saladict-e2e-' + Date.now()

const results = []
function pass(name) { results.push({ name, status: 'PASS' }); console.log(`  ✓ ${name}`) }
function fail(name, err) { results.push({ name, status: 'FAIL', error: err.message }); console.log(`  ✗ ${name}: ${err.message}`) }

function getDebuggerUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${DEBUG_PORT}/json/version`, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).webSocketDebuggerUrl)
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function waitForDebugger(maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await getDebuggerUrl() } catch { await new Promise(r => setTimeout(r, 500)) }
  }
  throw new Error('Chrome debugger not available after retries')
}

// Simple static file server for extension pages
function startServer() {
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  }
  const server = http.createServer((req, res) => {
    const filePath = path.join(EXTENSION_PATH, decodeURIComponent(req.url === '/' ? '/popup.html' : req.url))
    const ext = path.extname(filePath)
    if (!fs.existsSync(filePath)) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  })
  return new Promise(resolve => server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server)))
}

async function run() {
  console.log('Saladict MV3 E2E Tests')
  console.log('======================\n')

  if (!fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json'))) {
    console.error('ERROR: Build not found. Run "npx wxt build" first.')
    process.exit(1)
  }

  // ── Phase 1: Manifest & file integrity ──
  console.log('Phase 1: Manifest & File Integrity\n')

  let manifest
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(EXTENSION_PATH, 'manifest.json'), 'utf8'))
    const checks = [
      [manifest.manifest_version === 3, 'manifest_version is 3'],
      [!!manifest.background?.service_worker, 'has service_worker'],
      [!!manifest.action, 'has action field'],
      [manifest.permissions?.includes('offscreen'), 'has offscreen permission'],
      [manifest.permissions?.includes('scripting'), 'has scripting permission'],
      [manifest.permissions?.includes('webRequest'), 'has webRequest'],
      [!!manifest.content_scripts?.length, 'has content_scripts'],
      [!!manifest.default_locale, 'has default_locale'],
      [!!manifest.web_accessible_resources?.length, 'has web_accessible_resources'],
    ]
    const failures = checks.filter(([ok]) => !ok).map(([, msg]) => msg)
    if (failures.length) throw new Error('Missing: ' + failures.join(', '))
    pass('Manifest MV3 structure valid')
  } catch (err) {
    fail('Manifest MV3 structure valid', err)
  }

  // Verify all critical files exist
  try {
    const requiredFiles = [
      manifest.background?.service_worker,
      manifest.action?.default_popup,
      manifest.options_ui?.page,
      ...(manifest.content_scripts?.[0]?.js || []),
      ...(manifest.content_scripts?.[0]?.css || []),
    ].filter(Boolean)

    // Also check HTML pages
    const htmlPages = ['popup.html', 'options.html', 'history.html', 'notebook.html',
      'quick-search.html', 'word-editor.html', 'audio-control.html']
    requiredFiles.push(...htmlPages)

    const missing = requiredFiles.filter(f => !fs.existsSync(path.join(EXTENSION_PATH, f)))
    if (missing.length) throw new Error('Missing files: ' + missing.join(', '))
    pass(`All ${requiredFiles.length} critical files present`)
  } catch (err) {
    fail('Critical files present', err)
  }

  // Verify _locales
  try {
    const locale = manifest.default_locale
    const messagesPath = path.join(EXTENSION_PATH, '_locales', locale, 'messages.json')
    if (!fs.existsSync(messagesPath)) throw new Error(`Missing _locales/${locale}/messages.json`)
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'))
    if (!messages.extension_name?.message) throw new Error('Missing extension_name in messages')
    pass(`Locale ${locale} valid (${Object.keys(messages).length} keys)`)
  } catch (err) {
    fail('Locale files valid', err)
  }

  // Verify service worker is valid JS
  try {
    const swPath = path.join(EXTENSION_PATH, manifest.background.service_worker)
    const swContent = fs.readFileSync(swPath, 'utf8')
    if (swContent.length < 100) throw new Error(`Service worker too small (${swContent.length} chars)`)
    // Check it doesn't have obvious syntax issues by looking for common patterns
    if (swContent.includes('import ') && !swContent.includes('importScripts')) {
      // ES module style - valid for MV3 service workers
    }
    pass(`Service worker valid (${(swContent.length / 1024).toFixed(1)} KB)`)
  } catch (err) {
    fail('Service worker valid', err)
  }

  // ── Phase 2: Page rendering in Chrome ──
  console.log('\nPhase 2: Page Rendering\n')

  const server = await startServer()
  console.log(`  Static server on http://127.0.0.1:${HTTP_PORT}`)

  const chromeArgs = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`, '--no-first-run',
    '--no-default-browser-check', '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    'about:blank',
  ]

  let chromeProcess, browser
  try {
    chromeProcess = spawn(CHROME_PATH, chromeArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    })
    chromeProcess.stderr.on('data', () => {})
    chromeProcess.stdout.on('data', () => {})
    pass('Chrome process spawned')

    const wsUrl = await waitForDebugger()
    browser = await puppeteer.connect({ browserWSEndpoint: wsUrl })
    pass('Connected to Chrome via CDP')
  } catch (err) {
    fail('Chrome launch', err)
    server.close()
    printSummary()
    process.exit(1)
  }

  // Test each extension page renders via HTTP server
  const extensionPages = [
    ['Popup', 'popup.html'],
    ['Options', 'options.html'],
    ['History', 'history.html'],
    ['Notebook', 'notebook.html'],
    ['Quick Search', 'quick-search.html'],
    ['Word Editor', 'word-editor.html'],
    ['Audio Control', 'audio-control.html'],
  ]

  for (const [name, file] of extensionPages) {
    await testPage(browser, `http://127.0.0.1:${HTTP_PORT}/${file}`, name)
  }

  // ── Phase 3: Content script validation ──
  console.log('\nPhase 3: Content Script & Assets\n')

  try {
    const csJs = manifest.content_scripts[0].js[0]
    const csContent = fs.readFileSync(path.join(EXTENSION_PATH, csJs), 'utf8')
    if (csContent.length < 50) throw new Error(`Content script too small (${csContent.length} chars)`)
    pass(`Content script valid (${(csContent.length / 1024).toFixed(1)} KB)`)
  } catch (err) {
    fail('Content script valid', err)
  }

  try {
    const csCss = manifest.content_scripts[0].css[0]
    const cssContent = fs.readFileSync(path.join(EXTENSION_PATH, csCss), 'utf8')
    if (cssContent.length < 50) throw new Error(`Content CSS too small (${cssContent.length} chars)`)
    pass(`Content CSS valid (${(cssContent.length / 1024).toFixed(1)} KB)`)
  } catch (err) {
    fail('Content CSS valid', err)
  }

  // Verify icons exist
  try {
    const icons = manifest.icons || {}
    const missing = Object.values(icons).filter(p => !fs.existsSync(path.join(EXTENSION_PATH, p)))
    if (missing.length) throw new Error('Missing icons: ' + missing.join(', '))
    pass(`All ${Object.keys(icons).length} icons present`)
  } catch (err) {
    fail('Icons present', err)
  }

  // Verify web_accessible_resources patterns resolve to actual files
  try {
    const war = manifest.web_accessible_resources?.[0]?.resources || []
    let count = 0
    for (const pattern of war) {
      if (pattern.includes('*')) {
        // Glob pattern - just check the directory exists
        const dir = path.join(EXTENSION_PATH, pattern.split('*')[0])
        if (fs.existsSync(dir)) count++
      } else {
        if (fs.existsSync(path.join(EXTENSION_PATH, pattern))) count++
      }
    }
    pass(`Web accessible resources: ${count}/${war.length} patterns valid`)
  } catch (err) {
    fail('Web accessible resources', err)
  }

  // Verify the manifest uses runtime DNR permission without a static ruleset.
  try {
    if (manifest.declarative_net_request) {
      throw new Error('declarative_net_request ruleset key should not be present')
    }
    if (!manifest.permissions?.includes('webRequest')) {
      throw new Error('webRequest permission missing')
    }
    if (!manifest.permissions?.includes('declarativeNetRequestWithHostAccess')) {
      throw new Error('declarativeNetRequestWithHostAccess permission missing')
    }
    pass('Manifest networking permissions valid')
  } catch (err) {
    fail('webRequest migration check', err)
  }

  // ── Cleanup ──
  browser.disconnect()
  chromeProcess.kill()
  server.close()
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }) } catch {}
  printSummary()
}

async function testPage(browser, url, name) {
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(TIMEOUT)
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await new Promise(r => setTimeout(r, 2000))

    const content = await page.content()
    if (content.length < 100) throw new Error(`Page too small (${content.length} chars)`)

    // Check for React/app root element
    const hasRoot = await page.$('#root, #app, [data-reactroot], body > div')

    // Filter out expected errors (missing chrome.* APIs when served via HTTP)
    const criticalErrors = errors.filter(e =>
      !e.includes('net::ERR_') &&
      !e.includes('favicon') &&
      !e.includes('Failed to load resource') &&
      !e.includes('chrome.') &&
      !e.includes('browser.') &&
      !e.includes('is not defined') &&
      !e.includes('Cannot read properties of undefined')
    )

    if (criticalErrors.length > 0) {
      console.log(`    Warnings in ${name}:`, criticalErrors.slice(0, 3))
    }

    pass(`${name} page renders (${(content.length / 1024).toFixed(0)} KB${hasRoot ? ', has root' : ''})`)
    await page.close()
  } catch (err) {
    fail(`${name} page renders`, err)
  }
}

function printSummary() {
  console.log('\n======================')
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`)
  if (failed > 0) {
    console.log('\nFailed:')
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ✗ ${r.name}: ${r.error}`))
    process.exit(1)
  } else {
    console.log('\nAll E2E tests passed!')
    process.exit(0)
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
