import { message } from '@/_helpers/browser-api'
import { Subject } from 'rxjs'
import { switchMapBy } from '@/_helpers/observables'
import { timer } from '@/_helpers/promise-more'
import { getAppConfig } from './state'
import { locale as zhCNLocale } from '@/_locales/zh-CN/background'
import { locale as zhTWLocale } from '@/_locales/zh-TW/background'
import { locale as enLocale } from '@/_locales/en/background'

const backgroundLocales: Record<string, typeof zhCNLocale> = {
  'zh-CN': zhCNLocale,
  'zh-TW': zhTWLocale,
  en: enLocale
}

interface UpdateBadgeOptions {
  active: boolean
  tempDisable: boolean
  unsupported: boolean
}

const onUpdated$ = new Subject<{
  delay?: boolean
  tabId: number
  options?: UpdateBadgeOptions
}>()

onUpdated$
  .pipe(
    switchMapBy('tabId', async o => {
      if (o.options) {
        return o as Required<typeof o>
      }

      if (o.delay) {
        await timer(1000)
      }

      const appConfig = await getAppConfig()

      return {
        tabId: o.tabId,
        options: (await message
          .send<'GET_TAB_BADGE_INFO'>(o.tabId, {
            type: 'GET_TAB_BADGE_INFO'
          })
          .catch(() => {})) || {
          active: appConfig.active,
          tempDisable: false,
          unsupported: true
        }
      }
    })
  )
  .subscribe(({ tabId, options }) => {
    if (!options.active) {
      return setOff(tabId)
    }

    if (options.tempDisable) {
      return setTempOff(tabId)
    }

    if (options.unsupported) {
      return setUnsupported(tabId)
    }

    return setDefault(tabId)
  })

export function initBadge() {
  /** Sent when content script loaded */
  message.addListener('SEND_TAB_BADGE_INFO', ({ payload }, sender) => {
    if (sender.tab && sender.tab.id) {
      onUpdated$.next({ tabId: sender.tab.id, options: payload })
    }
  })

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
      onUpdated$.next({ tabId, delay: true })
    }
  })
}

async function setOff(tabId: number) {
  const appConfig = await getAppConfig()
  setIcon(true, tabId)
  browser.action.setTitle({
    title: (backgroundLocales[appConfig.langCode] || enLocale).app.off,
    tabId
  })
}

async function setTempOff(tabId: number) {
  const appConfig = await getAppConfig()
  setIcon(true, tabId)
  browser.action.setTitle({
    title: (backgroundLocales[appConfig.langCode] || enLocale).app.tempOff,
    tabId
  })
}

async function setUnsupported(tabId: number) {
  const appConfig = await getAppConfig()
  setIcon(true, tabId)
  browser.action.setTitle({
    title: (backgroundLocales[appConfig.langCode] || enLocale).app.unsupported,
    tabId
  })
}

function setDefault(tabId: number) {
  setIcon(false, tabId)
}

function setIcon(gray: boolean, tabId: number) {
  browser.action.setIcon({
    tabId,
    path: gray
      ? {
          16: 'assets/icon-gray-16.png',
          19: 'assets/icon-gray-19.png',
          24: 'assets/icon-gray-24.png',
          38: 'assets/icon-gray-38.png',
          48: 'assets/icon-gray-48.png',
          128: 'assets/icon-gray-128.png'
        }
      : {
          16: 'assets/icon-16.png',
          19: 'assets/icon-19.png',
          24: 'assets/icon-24.png',
          38: 'assets/icon-38.png',
          48: 'assets/icon-48.png',
          128: 'assets/icon-128.png'
        }
  })
}
