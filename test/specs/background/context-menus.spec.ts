import { getDefaultConfig, AppConfigMutable } from '@/app-config'
import { timer } from '@/_helpers/promise-more'
import { of } from 'rxjs'
import { browser } from '../../helper'

let currentConfig: AppConfigMutable

jest.mock('@/_helpers/browser-api')
jest.mock('@/_helpers/config-manager', () => ({
  createConfigStream: jest.fn(() => of(currentConfig || getDefaultConfig()))
}))
jest.mock('@/background/server', () => ({
  BackgroundServer: {
    getInstance: jest.fn(() => ({
      searchPageSelection: jest.fn()
    }))
  }
}))
jest.mock('@/background/i18n-manager', () => ({
  I18nManager: {
    getInstance: jest.fn(async () => ({
      i18n: {
        t: jest.fn((key: string) => key)
      },
      getFixedT$: jest.fn(() => of((key: string) => key))
    }))
  }
}))
jest.mock('@/background/pdf-sniffer', () => ({
  openPDF: jest.fn(),
  extractPDFUrl: jest.fn((url?: string) => url)
}))
jest.mock('@/background/clipboard-manager', () => ({
  copyTextToClipboard: jest.fn()
}))

jest.mock('@/background/state', () => ({
  getAppConfig: jest.fn(() => Promise.resolve(currentConfig)),
  setAppConfig: jest.fn()
}))

let browserApi: typeof import('@/_helpers/browser-api')
let openPDF: jest.Mock

function specialConfig() {
  const config = getDefaultConfig() as AppConfigMutable
  config.contextMenus.selected = [
    'youdao_page_translate',
    'view_as_pdf',
    'bing_dict'
  ]
  config.searchHistory = true
  return config
}

async function loadContextMenus() {
  const { ContextMenus } = require('@/background/context-menus')
  return ContextMenus
}

describe('Context Menus', () => {
  beforeEach(() => {
    jest.resetModules()
    browserApi = require('@/_helpers/browser-api')
    ;({ openPDF } = require('@/background/pdf-sniffer'))
    browser.flush()
    browser.i18n.getUILanguage.returns('en')
    browser.runtime.getURL.callsFake((path: string) => path)
    browser.contextMenus.create.callsFake((_props, cb) => cb && cb())
    browser.contextMenus.removeAll.callsFake(() => Promise.resolve())
    browser.tabs.query.callsFake(() =>
      Promise.resolve([{ id: 1, url: 'https://example.com/page' }])
    )
    ;(chrome.scripting.executeScript as jest.Mock).mockReset()
    ;(chrome.scripting.executeScript as jest.Mock).mockResolvedValue([1])
    ;(openPDF as jest.Mock).mockReset()
    browserApi.openUrl.mockClear()
    currentConfig = getDefaultConfig() as AppConfigMutable
  })

  it('registers click listeners once', async () => {
    const ContextMenus = await loadContextMenus()

    await ContextMenus.init()
    await ContextMenus.init()

    expect(browser.contextMenus.onClicked.addListener.calledOnce).toBeTruthy()
  })

  it('runs page-translate actions through chrome.scripting', async () => {
    const ContextMenus = await loadContextMenus()
    await ContextMenus.init()

    browser.contextMenus.onClicked.dispatch({
      menuItemId: 'google_page_translate'
    })
    await timer(0)
    expect(chrome.scripting.executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        files: ['assets/google-page-trans.js']
      })
    )

    browser.contextMenus.onClicked.dispatch({
      menuItemId: 'youdao_page_translate'
    })
    await timer(0)
    expect(chrome.scripting.executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        files: ['assets/fanyi.youdao.2.0/main.js']
      })
    )
  })

  it('opens PDF viewer from the context menu', async () => {
    const ContextMenus = await loadContextMenus()
    await ContextMenus.init()

    browser.contextMenus.onClicked.dispatch({
      menuItemId: 'view_as_pdf',
      linkUrl: 'https://example.com/test.pdf'
    })
    await timer(0)

    expect(openPDF).toHaveBeenCalledWith('https://example.com/test.pdf', true)
  })

  it('opens history and notebook pages from action menu items', async () => {
    const ContextMenus = await loadContextMenus()
    await ContextMenus.init()

    browser.contextMenus.onClicked.dispatch({ menuItemId: 'search_history' })
    await timer(0)
    expect(browserApi.openUrl).toHaveBeenCalledWith('history.html')

    browserApi.openUrl.mockClear()
    browser.contextMenus.onClicked.dispatch({ menuItemId: 'notebook' })
    await timer(0)
    expect(browserApi.openUrl).toHaveBeenCalledWith('notebook.html')
  })

  it('opens configured selection providers with encoded text', async () => {
    const ContextMenus = await loadContextMenus()
    currentConfig = specialConfig()
    await ContextMenus.init()

    browser.contextMenus.onClicked.dispatch({
      menuItemId: 'bing_dict',
      selectionText: 'hello world'
    })
    await timer(0)

    expect(browserApi.openUrl).toHaveBeenCalledWith(
      expect.stringContaining('hello%20world')
    )
  })

  it('creates MV3 action menus from the current config', async () => {
    const ContextMenus = await loadContextMenus()
    const instance = await ContextMenus.init()

    browser.contextMenus.create.resetHistory()
    browser.contextMenus.removeAll.resetHistory()

    const config = specialConfig()
    await instance['setContextMenus']([config, ((key: string) => key) as any])

    expect(browser.contextMenus.removeAll.calledOnce).toBeTruthy()
    const createdMenus = browser.contextMenus.create.args.map(([props]) => props)

    expect(createdMenus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'saladict_container' }),
        expect.objectContaining({
          id: 'bing_dict',
          parentId: 'saladict_container'
        }),
        expect.objectContaining({
          id: 'youdao_page_translate_ba',
          contexts: ['action']
        }),
        expect.objectContaining({
          id: 'view_as_pdf_ba',
          contexts: ['action']
        }),
        expect.objectContaining({
          id: 'search_history',
          contexts: ['action']
        }),
        expect.objectContaining({
          id: 'notebook',
          contexts: ['action']
        })
      ])
    )
  })
})
