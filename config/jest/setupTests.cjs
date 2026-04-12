const browser = require('sinon-chrome/extensions')

// MV3: browser.action (replaces browserAction)
if (!browser.action) {
  browser.action = {
    setIcon: browser.browserAction.setIcon,
    setTitle: browser.browserAction.setTitle,
    setBadgeText: browser.browserAction.setBadgeText,
    setBadgeBackgroundColor: browser.browserAction.setBadgeBackgroundColor,
    onClicked: browser.browserAction.onClicked
  }
}

window.browser = browser

// Mock chrome.* APIs for MV3
const chromeMock = {
  runtime: {
    sendMessage: jest.fn(() => Promise.resolve()),
    getContexts: jest.fn(() => Promise.resolve([])),
    getURL: jest.fn(path => 'chrome-extension://test-id/' + path),
    onMessage: browser.runtime.onMessage,
    ContextType: { OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT' }
  },
  offscreen: {
    createDocument: jest.fn(() => Promise.resolve()),
    Reason: { AUDIO_PLAYBACK: 'AUDIO_PLAYBACK', CLIPBOARD: 'CLIPBOARD' }
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve()),
    insertCSS: jest.fn(() => Promise.resolve())
  },
  declarativeNetRequest: {
    updateSessionRules: jest.fn(() => Promise.resolve()),
    getSessionRules: jest.fn(() => Promise.resolve([]))
  },
  system: {
    display: {
      getInfo: jest.fn(() => Promise.resolve([{
        isPrimary: true,
        workArea: { width: 1920, height: 1080, top: 0, left: 0 }
      }]))
    }
  },
  tabs: {
    update: jest.fn(() => Promise.resolve())
  },
  permissions: {
    contains: jest.fn(() => Promise.resolve(true))
  }
}
global.chrome = chromeMock

// raf polyfill
require('raf').polyfill(global)
