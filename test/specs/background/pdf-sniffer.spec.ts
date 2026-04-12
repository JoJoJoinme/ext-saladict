import { getDefaultConfig, AppConfigMutable, AppConfig } from '@/app-config'
import { matchPatternToRegExpStr } from '@/_helpers/matchPatternToRegExpStr'
import { init as initPdfOrigin } from '@/background/pdf-sniffer'
import { timer } from '@/_helpers/promise-more'
import * as configManagerMock from '@/_helpers/__mocks__/config-manager'
import { browser } from '../../helper'

jest.mock('@/_helpers/config-manager')

// Mock state.ts to provide appConfig
jest.mock('@/background/state', () => {
  const { getDefaultConfig } = require('@/app-config')
  let _appConfig = getDefaultConfig()
  return {
    getAppConfig: jest.fn(() => Promise.resolve(_appConfig)),
    getAppConfigSync: jest.fn(() => _appConfig),
    setAppConfig: jest.fn((c: any) => { _appConfig = c }),
    _setTestConfig: (c: any) => { _appConfig = c }
  }
})

let configManager: typeof configManagerMock
let stateModule: { _setTestConfig: (c: any) => void }

function hasListenerPatch(fn) {
  // @ts-ignore
  if (this._listeners) {
    // @ts-ignore
    return this._listeners.some(x => x === fn)
  }
  return false
}

function changeConfig(newConfig: AppConfig, oldConfig: AppConfig) {
  stateModule._setTestConfig(newConfig)
  configManager.dispatchConfigChangedEvent(newConfig, oldConfig)
}

let initPdf: typeof initPdfOrigin

describe('PDF Sniffer', () => {
  beforeEach(() => {
    browser.flush()
    browser.runtime.getURL.callsFake(s => s)
    jest.resetModules()

    // Re-mock state after resetModules
    jest.mock('@/background/state', () => {
      const { getDefaultConfig } = require('@/app-config')
      let _appConfig = getDefaultConfig()
      return {
        getAppConfig: jest.fn(() => Promise.resolve(_appConfig)),
        getAppConfigSync: jest.fn(() => _appConfig),
        setAppConfig: jest.fn((c: any) => { _appConfig = c }),
        _setTestConfig: (c: any) => { _appConfig = c }
      }
    })

    initPdf = require('@/background/pdf-sniffer').init
    configManager = require('@/_helpers/config-manager')
    stateModule = require('@/background/state')
    // @ts-ignore
    browser.webRequest.onHeadersReceived.hasListener = hasListenerPatch
    // @ts-ignore
    browser.tabs.onUpdated.hasListener = hasListenerPatch

    stateModule._setTestConfig(getDefaultConfig())

    // Reset chrome.tabs.update mock
    ;(chrome.tabs.update as jest.Mock).mockClear()
    browser.tabs.create.resetHistory()
  })

  const urlPdf = 'https://test.com/c.pdf'
  const urlPdfEncoded = encodeURIComponent(urlPdf)
  const urlTxt = 'https://test.com/c.txt'

  it('should not start sniffing if sniff config is off', async () => {
    const config = getDefaultConfig() as AppConfigMutable
    config.pdfSniff = false
    stateModule._setTestConfig(config)
    initPdf(config)
    await timer(0)
    expect(
      browser.webRequest.onHeadersReceived.addListener.notCalled
    ).toBeTruthy()
    expect(browser.tabs.onUpdated.addListener.notCalled).toBeTruthy()
    expect(configManager.addConfigListener).toHaveBeenCalledTimes(1)
  })

  it('should start sniffing if sniff config is on', async () => {
    const config = getDefaultConfig() as AppConfigMutable
    config.pdfSniff = true
    stateModule._setTestConfig(config)
    initPdf(config)
    await timer(0)
    expect(
      browser.webRequest.onHeadersReceived.addListener.calledOnce
    ).toBeTruthy()
    expect(browser.tabs.onUpdated.addListener.calledOnce).toBeTruthy()
    expect(configManager.addConfigListener).toHaveBeenCalledTimes(1)
  })

  it('should stop sniffing if sniff config is turned off', async () => {
    const config = getDefaultConfig() as AppConfigMutable
    config.pdfSniff = true
    stateModule._setTestConfig(config)
    initPdf(config)
    await timer(0)
    changeConfig(
      { ...config, pdfSniff: false },
      { ...config, pdfSniff: true }
    )
    await timer(0)
    expect(
      browser.webRequest.onHeadersReceived.addListener.calledOnce
    ).toBeTruthy()
    expect(
      browser.webRequest.onHeadersReceived.removeListener.calledOnce
    ).toBeTruthy()
    expect(browser.tabs.onUpdated.removeListener.calledOnce).toBeTruthy()
    expect(configManager.addConfigListener).toHaveBeenCalledTimes(1)
  })

  it('should start sniffing only once if init multiple times', async () => {
    const config = getDefaultConfig() as AppConfigMutable
    config.pdfSniff = true
    stateModule._setTestConfig(config)
    initPdf(config)
    initPdf(config)
    initPdf(config)
    initPdf(config)
    await timer(0)
    expect(
      browser.webRequest.onHeadersReceived.addListener.calledOnce
    ).toBeTruthy()
    expect(browser.tabs.onUpdated.addListener.calledOnce).toBeTruthy()
    expect(configManager.addConfigListener).toHaveBeenCalledTimes(1)
  })

  it('should start sniffing only once if being turned on multiple times', async () => {
    const config = getDefaultConfig() as AppConfigMutable
    config.pdfSniff = false
    stateModule._setTestConfig(config)
    initPdf(config)
    await timer(0)
    changeConfig(
      { ...config, pdfSniff: true },
      { ...config, pdfSniff: false }
    )
    changeConfig(
      { ...config, pdfSniff: true },
      { ...config, pdfSniff: false }
    )
    await timer(0)
    expect(
      browser.webRequest.onHeadersReceived.addListener.calledOnce
    ).toBeTruthy()
    expect(browser.tabs.onUpdated.addListener.calledOnce).toBeTruthy()
    expect(configManager.addConfigListener).toHaveBeenCalledTimes(1)
  })

  describe('intercept http/https pdf request via non-blocking observer', () => {
    it('No PDF Content', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]

      // No responseHeaders
      await handler({ responseHeaders: undefined, url: urlPdf, tabId: 1 })
      expect(chrome.tabs.update).not.toHaveBeenCalled()

      // Non-PDF content type
      await handler({
        responseHeaders: [{ name: 'content-type', value: 'other' }],
        url: urlPdf,
        tabId: 1
      })
      expect(chrome.tabs.update).not.toHaveBeenCalled()
    })

    it('With PDF Content Type', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]
      const responseHeaders = [
        { name: 'content-type', value: 'application/pdf' }
      ]

      await handler({ responseHeaders, url: urlPdf, tabId: 1 })
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, {
        url: expect.stringContaining(urlPdfEncoded)
      })
    })

    it('PDF url with octet-stream Content Type', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]
      const responseHeaders = [
        { name: 'content-type', value: 'application/octet-stream' }
      ]

      await handler({ responseHeaders, url: urlPdf, tabId: 1 })
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, {
        url: expect.stringContaining(urlPdfEncoded)
      })

      ;(chrome.tabs.update as jest.Mock).mockClear()

      // Non-PDF URL with octet-stream should not redirect
      await handler({ responseHeaders, url: urlTxt, tabId: 1 })
      expect(chrome.tabs.update).not.toHaveBeenCalled()
    })

    it('should not intercept if the url matches blacklist', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      config.pdfBlacklist = [[matchPatternToRegExpStr(urlPdf), urlPdf]]
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]
      const responseHeaders = [
        { name: 'content-type', value: 'application/pdf' }
      ]

      await handler({ responseHeaders, url: urlPdf, tabId: 1 })
      expect(chrome.tabs.update).not.toHaveBeenCalled()
    })

    it('should intercept if the url matches whitelist', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      config.pdfWhitelist = [[matchPatternToRegExpStr(urlPdf), urlPdf]]
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]
      const responseHeaders = [
        { name: 'content-type', value: 'application/pdf' }
      ]

      await handler({ responseHeaders, url: urlPdf, tabId: 1 })
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, {
        url: expect.stringContaining(urlPdfEncoded)
      })
    })

    it('should intercept if the url matches both blacklist and whitelist', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      config.pdfBlacklist = [[matchPatternToRegExpStr(urlPdf), urlPdf]]
      config.pdfWhitelist = [[matchPatternToRegExpStr(urlPdf), urlPdf]]
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]
      const responseHeaders = [
        { name: 'content-type', value: 'application/pdf' }
      ]

      await handler({ responseHeaders, url: urlPdf, tabId: 1 })
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, {
        url: expect.stringContaining(urlPdfEncoded)
      })
    })

    it('should open the viewer in a new tab when the request has no tab id', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]
      const responseHeaders = [
        { name: 'content-type', value: 'application/pdf' }
      ]

      await handler({ responseHeaders, url: urlPdf, tabId: -1 })
      expect(browser.tabs.create.calledOnce).toBeTruthy()
      expect(browser.tabs.create.firstCall.args[0].active).toBeTruthy()
      expect(String(browser.tabs.create.firstCall.args[0].url)).toContain(
        urlPdfEncoded
      )
      expect(chrome.tabs.update).not.toHaveBeenCalled()
    })

    it('should intercept a .pdf url even when content-type is missing', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.webRequest.onHeadersReceived['_listeners'][0]

      await handler({
        responseHeaders: [{ name: 'cache-control', value: 'no-store' }],
        url: urlPdf,
        tabId: 1
      })
      expect(chrome.tabs.update).toHaveBeenCalledWith(1, {
        url: expect.stringContaining(urlPdfEncoded)
      })
    })

    it('should redirect direct .pdf tab updates via tabs.onUpdated fallback', async () => {
      const config = getDefaultConfig() as AppConfigMutable
      config.pdfSniff = true
      stateModule._setTestConfig(config)
      initPdf(config)
      await timer(0)
      const handler = browser.tabs.onUpdated['_listeners'][0]

      await handler(
        7,
        { url: urlPdf },
        {
          id: 7,
          url: urlPdf
        }
      )

      expect(chrome.tabs.update).toHaveBeenCalledWith(7, {
        url: expect.stringContaining(urlPdfEncoded)
      })
    })
  })
})
