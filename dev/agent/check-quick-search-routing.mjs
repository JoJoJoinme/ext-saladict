import { chromium } from 'playwright-core'

const browserUrl = process.env.SHARED_CHROME_BROWSER_URL || 'http://127.0.0.1:9222'
const waitMs = Number(process.env.SHARED_CHROME_QUERY_WAIT_MS || 10000)
const rawQueries = process.argv.slice(2)
const queries =
  rawQueries.length > 0
    ? rawQueries
    : [
        'example',
        'injuring more',
        'general secretary of the Communist Party of China',
      ]

function strip(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

async function resolveExtensionId(browser) {
  const session = await browser.newBrowserCDPSession()
  const { targetInfos } = await session.send('Target.getTargets')

  const extensionTarget = targetInfos.find(target =>
    target.url.startsWith('chrome-extension://')
  )

  if (!extensionTarget) {
    throw new Error('Could not find any chrome-extension target in the shared browser')
  }

  return extensionTarget.url.split('/')[2]
}

async function inspectQuery(context, extensionId, query) {
  let lastError = null

  for (let attempt = 1; attempt <= 2; attempt++) {
    const page = await context.newPage()
    try {
      await page.goto(`chrome-extension://${extensionId}/quick-search.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForTimeout(2000)

      const input = page.locator('[data-testid="lookup-search-input"]')
      await input.fill(query)
      await input.press('Enter')
      await page.waitForTimeout(waitMs)

      return await page.evaluate(currentQuery => {
        const items = Array.from(document.querySelectorAll('.dictItem')).map(item => ({
          title:
            item.querySelector('.dictItemHead-Title')?.textContent?.replace(/\s+/g, ' ').trim() ||
            '',
          text:
            item.querySelector('.dictRoot')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) ||
            '',
          empty:
            item.querySelector('.dictItem-EmptyState')?.textContent?.replace(/\s+/g, ' ').trim() || '',
          raw: item.textContent?.replace(/\s+/g, ' ').trim().slice(0, 400) || '',
        }))

        return {
          query: currentQuery,
          renderedTitles: items.map(item => item.title).filter(Boolean),
          items,
        }
      }, query)
    } catch (error) {
      lastError = error
      if (attempt === 2) {
        throw error
      }
      await page.waitForTimeout(1000).catch(() => {})
    } finally {
      await page.close().catch(() => {})
    }
  }

  throw lastError
}

const browser = await chromium.connectOverCDP(browserUrl)

try {
  const [context] = browser.contexts()
  if (!context) {
    throw new Error('No browser context found after connectOverCDP')
  }

  const extensionId = await resolveExtensionId(browser)
  const results = []

  for (const query of queries) {
    results.push(await inspectQuery(context, extensionId, query))
  }

  process.stdout.write(
    JSON.stringify(
      {
        browserUrl,
        extensionId,
        waitMs,
        results: results.map(result => ({
          ...result,
          renderedTitles: result.renderedTitles.map(strip),
        })),
      },
      null,
      2
    )
  )
  process.stdout.write('\n')
} finally {
  await browser.close()
}
