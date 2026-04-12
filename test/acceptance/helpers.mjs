import fs from 'fs'
import path from 'path'

export function findBrowserPath() {
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

export function getBrowserProxyServer() {
  return process.env.BROWSER_PROXY || ''
}

export function getBrowserProxyConfig() {
  const server = getBrowserProxyServer()
  if (!server) {
    return undefined
  }

  return {
    server,
    bypass: '127.0.0.1,localhost'
  }
}

export async function getTextRect(page, selector, targetText) {
  return page.evaluate(
    ({ selector, targetText }) => {
      const root = document.querySelector(selector)
      if (!root) return null

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let current = walker.nextNode()

      while (current) {
        const text = current.textContent || ''
        const start = text.indexOf(targetText)
        if (start >= 0) {
          const range = document.createRange()
          range.setStart(current, start)
          range.setEnd(current, start + targetText.length)
          return range.getBoundingClientRect().toJSON()
        }
        current = walker.nextNode()
      }

      return null
    },
    { selector, targetText }
  )
}

export async function waitFor(check, timeoutMs = 20000, intervalMs = 250) {
  const startedAt = Date.now()
  let lastValue

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await check()
    if (lastValue) {
      return lastValue
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  return null
}

export async function getDeepRect(page, selector) {
  return page.evaluate(selector => {
    const deepQuery = (root, currentSelector) => {
      if (!root) return null
      if (root.querySelector) {
        const direct = root.querySelector(currentSelector)
        if (direct) return direct
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
      let current = walker.currentNode

      while (current) {
        if (current.shadowRoot) {
          const hit = deepQuery(current.shadowRoot, currentSelector)
          if (hit) return hit
        }
        current = walker.nextNode()
      }

      return null
    }

    const element = deepQuery(document, selector)
    return element ? element.getBoundingClientRect().toJSON() : null
  }, selector)
}

export async function clickDeep(page, selector) {
  const rect = await getDeepRect(page, selector)
  if (!rect) {
    return false
  }

  const point = centerOf(rect)
  await page.mouse.click(point.x, point.y)
  return true
}

export async function readLookupUi(page) {
  return page.evaluate(() => {
    const deepQuery = (root, selector) => {
      if (!root) return null
      if (root.querySelector) {
        const direct = root.querySelector(selector)
        if (direct) return direct
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
      let current = walker.currentNode

      while (current) {
        if (current.shadowRoot) {
          const hit = deepQuery(current.shadowRoot, selector)
          if (hit) return hit
        }
        current = walker.nextNode()
      }

      return null
    }

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

    const bowl = deepQuery(document, '[data-testid="lookup-bowl"]')
    const panel = deepQuery(
      document,
      '[data-testid="lookup-panel"], .dictPanel-Root'
    )
    const searchInput = deepQuery(
      document,
      '[data-testid="lookup-search-input"]'
    )
    const favButton = deepQuery(document, '[data-testid="lookup-fav-button"]')
    const historyBackButton = deepQuery(
      document,
      '[data-testid="lookup-history-back"]'
    )
    const historyForwardButton = deepQuery(
      document,
      '[data-testid="lookup-history-forward"]'
    )
    const items = deepQueryAll(document, '[data-testid="lookup-dict-item"]').map(
      item => {
        const terminal = deepQuery(
          item,
          '[data-testid="lookup-dict-result"], [data-testid="lookup-dict-empty"], [data-testid="lookup-dict-error"]'
        )
        const loading = deepQuery(item, '[data-testid="lookup-dict-loading"]')
        return {
          dictId: item.getAttribute('data-dict-id') || '',
          requestState: item.getAttribute('data-lookup-request-state') || '',
          contentState: terminal?.getAttribute('data-lookup-state') || '',
          loadingVisible: !!loading,
          text: terminal?.textContent?.trim() || ''
        }
      }
    )

    const inferredCounts = items.reduce(
      (counts, item) => {
        if (item.loadingVisible || item.requestState === 'loading') {
          counts.loading += 1
        } else if (item.contentState === 'success') {
          counts.success += 1
        } else if (item.contentState === 'empty') {
          counts.empty += 1
        } else if (item.contentState === 'error') {
          counts.error += 1
        }
        return counts
      },
      { success: 0, empty: 0, error: 0, loading: 0 }
    )

    const explicitPanelState = panel?.getAttribute('data-lookup-state') || ''
    const explicitPanelTerminal =
      panel?.getAttribute('data-lookup-terminal') === 'true'

    const inferredPanelState = inferredCounts.loading
      ? 'loading'
      : inferredCounts.success
      ? 'success'
      : inferredCounts.error
      ? 'error'
      : inferredCounts.empty
      ? 'empty'
      : ''

    const inferredPanelTerminal =
      items.length > 0 &&
      inferredCounts.loading === 0 &&
      items.every(
        item =>
          item.requestState === 'loading' ||
          item.requestState === 'idle' ||
          !!item.contentState
      )

    return {
      selection: window.getSelection()?.toString() || '',
      bowlVisible: !!bowl,
      bowlRect: bowl ? bowl.getBoundingClientRect().toJSON() : null,
      panelVisible: !!panel,
      panelState: explicitPanelState || inferredPanelState,
      panelTerminal: explicitPanelState
        ? explicitPanelTerminal
        : inferredPanelTerminal,
      queryText: searchInput?.value || '',
      favActive: favButton?.getAttribute('data-lookup-active') === 'true',
      historyBackDisabled: !!historyBackButton?.disabled,
      historyForwardDisabled: !!historyForwardButton?.disabled,
      panelCounts: panel
        ? {
            success: Number(
              panel.getAttribute('data-lookup-success-count') ||
                inferredCounts.success
            ),
            empty: Number(
              panel.getAttribute('data-lookup-empty-count') ||
                inferredCounts.empty
            ),
            error: Number(
              panel.getAttribute('data-lookup-error-count') ||
                inferredCounts.error
            ),
            loading: Number(
              panel.getAttribute('data-lookup-loading-count') ||
                inferredCounts.loading
            )
          }
        : null,
      items,
      blankFinishedItems: items.filter(
        item =>
          item.requestState !== 'loading' &&
          item.requestState !== 'idle' &&
          !item.contentState
      )
    }
  })
}

export function centerOf(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  }
}
