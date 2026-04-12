/**
 * Open pdf link directly
 * MV3: blocking webRequest removed. Uses non-blocking webRequest observer
 * for Content-Type based PDF detection, then redirects via chrome.tabs.update.
 */

import { AppConfig } from '@/app-config'
import { addConfigListener } from '@/_helpers/config-manager'
import { openUrl } from '@/_helpers/browser-api'
import { getAppConfig, getAppConfigSync } from './state'

let initialized = false

export function init(config: AppConfig) {
  syncPdfSniffer(config)

  if (!initialized) {
    initialized = true
    addConfigListener(({ newConfig, oldConfig }) => {
      if (newConfig) {
        if (!oldConfig || newConfig.pdfSniff !== oldConfig.pdfSniff) {
          syncPdfSniffer(newConfig)
        }
      }
    })
  }
}

export function syncPdfSniffer(config: AppConfig) {
  if (config.pdfSniff) {
    startListening()
  } else {
    stopListening()
  }
}

/**
 * @param url provide a url
 * @param force load the current tab anyway
 */
export async function openPDF(url?: string, force?: boolean) {
  let pdfURL = browser.runtime.getURL('assets/pdf/web/viewer.html')
  const appConfig = await getAppConfig()

  if (url) {
    pdfURL += '?file=' + encodeURIComponent(url)
  } else {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs.length > 0 && tabs[0].url) {
      const curURL = tabs[0].url
      if (curURL.startsWith(pdfURL)) {
        if (appConfig.pdfStandalone) {
          if (tabs[0].id != null) {
            await browser.tabs.remove(tabs[0].id)
          }
          pdfURL = curURL
        } else {
          return // ignore pdf viewer url
        }
      } else if (force || curURL.endsWith('pdf')) {
        pdfURL += '?file=' + encodeURIComponent(curURL)
      }
    }
  }

  return appConfig.pdfStandalone
    ? openPDFStandalone(pdfURL)
    : openUrl({ url: pdfURL, unique: false })
}

export function extractPDFUrl(fullurl?: string): string | void {
  if (!fullurl) {
    return
  }
  const searchURL = new URL(fullurl)
  return decodeURIComponent(searchURL.searchParams.get('file') || '')
}

let isListening = false

function startListening() {
  if (isListening) return
  isListening = true

  // Content-Type based detection via non-blocking webRequest observer
  if (!browser.webRequest.onHeadersReceived.hasListener(httpPdfListener)) {
    browser.webRequest.onHeadersReceived.addListener(
      httpPdfListener,
      {
        urls: ['https://*/*', 'http://*/*'],
        types: ['main_frame', 'sub_frame', 'other']
      },
      ['responseHeaders']
    )
  }

  if (!browser.tabs.onUpdated.hasListener(tabUpdatedListener)) {
    browser.tabs.onUpdated.addListener(tabUpdatedListener)
  }
}

function stopListening() {
  isListening = false

  browser.webRequest.onHeadersReceived.removeListener(httpPdfListener)
  browser.tabs.onUpdated.removeListener(tabUpdatedListener)
}

/**
 * MV3: Non-blocking observer. Detects PDF Content-Type in response headers
 * and redirects the tab using chrome.tabs.update instead of returning { redirectUrl }.
 */
function httpPdfListener(
  details: browser.webRequest._OnHeadersReceivedDetails
) {
  const { tabId, responseHeaders, url } = details
  if (!responseHeaders) return

  const appConfig = getAppConfigSync()
  if (!appConfig) {
    return
  }

  const contentTypeHeader = responseHeaders.find(
    ({ name }) => name.toLowerCase() === 'content-type'
  )
  const urlPath = (() => {
    try {
      return new URL(url).pathname.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  })()
  const isPdfPath = urlPath.endsWith('.pdf')

  const matchURL = ([r]: ReadonlyArray<string>) => new RegExp(r).test(url)
  if (
    appConfig.pdfBlacklist.some(matchURL) &&
    !appConfig.pdfWhitelist.some(matchURL)
  ) {
    return
  }

  if (contentTypeHeader && contentTypeHeader.value) {
    const contentType = contentTypeHeader.value.toLowerCase()
    if (
      contentType.endsWith('pdf') ||
      (contentType === 'application/octet-stream' && isPdfPath)
    ) {
      const redirectUrl = browser.runtime.getURL(
        `assets/pdf/web/viewer.html?file=${encodeURIComponent(url)}`
      )
      redirectPdfUrl(tabId, redirectUrl, appConfig)
      return
    }
  }

  if (!contentTypeHeader?.value && isPdfPath) {
    const redirectUrl = browser.runtime.getURL(
      `assets/pdf/web/viewer.html?file=${encodeURIComponent(url)}`
    )
    redirectPdfUrl(tabId, redirectUrl, appConfig)
    return
  }
}

function tabUpdatedListener(
  tabId: number,
  changeInfo: browser.tabs._OnUpdatedChangeInfo,
  tab: browser.tabs.Tab
) {
  const appConfig = getAppConfigSync()
  if (!appConfig) {
    return
  }

  const candidateUrl = changeInfo.url || tab.url
  if (!candidateUrl || !candidateUrl.startsWith('http')) {
    return
  }

  const pathname = (() => {
    try {
      return new URL(candidateUrl).pathname.toLowerCase()
    } catch {
      return candidateUrl.toLowerCase()
    }
  })()
  if (!pathname.endsWith('.pdf')) {
    return
  }

  const matchURL = ([r]: ReadonlyArray<string>) => new RegExp(r).test(candidateUrl)
  if (
    appConfig.pdfBlacklist.some(matchURL) &&
    !appConfig.pdfWhitelist.some(matchURL)
  ) {
    return
  }

  const redirectUrl = browser.runtime.getURL(
    `assets/pdf/web/viewer.html?file=${encodeURIComponent(candidateUrl)}`
  )
  redirectPdfUrl(tabId, redirectUrl, appConfig)
}

function redirectPdfUrl(tabId: number, redirectUrl: string, appConfig: AppConfig) {
  if (tabId === -1) {
    if (appConfig.pdfStandalone === 'always') {
      void browser.windows.create({ type: 'popup', url: redirectUrl })
    } else {
      void browser.tabs.create({ url: redirectUrl, active: true })
    }
    return
  }

  if (appConfig.pdfStandalone === 'always') {
    void browser.tabs.remove(tabId)
    void openPDFStandalone(redirectUrl)
    return
  }

  void chrome.tabs.update(tabId, { url: redirectUrl })
}

function openPDFStandalone(url: string) {
  return browser.windows.create({ type: 'popup', url })
}
