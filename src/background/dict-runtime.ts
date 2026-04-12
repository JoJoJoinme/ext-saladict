import { DictID } from '@/app-config'
import { Profile } from '@/app-config/profiles'

const ZDIC_AUDIO_RULE_ID = 1001
const ZDIC_AUDIO_REFERER = 'https://www.zdic.net'
const ZDIC_AUDIO_URL_FILTER = 'https://img.zdic.net/audio/*'
const HJDICT_COOKIE_URL = 'https://www.hjdict.com'
const HJDICT_COOKIE_DOMAIN = 'hjdict.com'

type HJDictCookieValue = string | number

export async function prepareDictionaryRuntime(
  id: DictID,
  activeProfile: Profile
): Promise<void> {
  switch (id) {
    case 'zdic':
      if (activeProfile.dicts.all.zdic.options.audio) {
        await ensureZdicAudioRefererRule()
      }
      return

    case 'hjdict':
      await seedHjdictCookies()
      return
  }
}

export async function ensureZdicAudioRefererRule(): Promise<void> {
  if (!chrome.declarativeNetRequest?.updateSessionRules) {
    return
  }

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ZDIC_AUDIO_RULE_ID],
    addRules: [
      {
        id: ZDIC_AUDIO_RULE_ID,
        priority: 1,
        action: {
          type:
            'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
          requestHeaders: [
            {
              header: 'Referer',
              operation:
                'set' as chrome.declarativeNetRequest.HeaderOperation,
              value: ZDIC_AUDIO_REFERER
            }
          ]
        },
        condition: {
          urlFilter: ZDIC_AUDIO_URL_FILTER,
          resourceTypes: [
            'media' as chrome.declarativeNetRequest.ResourceType,
            'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType
          ]
        }
      }
    ]
  })
}

export async function seedHjdictCookies(): Promise<void> {
  const cookies = buildHjdictCookies()

  await Promise.all(
    Object.entries(cookies).map(([name, value]) =>
      browser.cookies.set({
        url: HJDICT_COOKIE_URL,
        domain: HJDICT_COOKIE_DOMAIN,
        name,
        value: String(value)
      })
    )
  )
}

export function buildHjdictCookies(): Record<string, HJDictCookieValue> {
  return {
    HJ_SITEID: 3,
    HJ_UID: getUUID(),
    HJ_SID: getUUID(),
    HJ_SSID: getUUID(),
    HJID: 0,
    HJ_VT: 2,
    HJ_SST: 1,
    HJ_CSST: 1,
    HJ_ST: 1,
    HJ_CST: 1,
    HJ_T: Date.now(),
    _: getUUID(16)
  }
}

function getUUID(lengthOrTemplate?: number | string): string {
  let radix = arguments.length > 1 && undefined !== arguments[1] ? arguments[1] : 16
  let template = ''

  if (typeof lengthOrTemplate === 'number') {
    for (let i = 0; i < lengthOrTemplate; i++) {
      const digit = Math.floor(10 * Math.random())
      template += digit % 2 === 0 ? 'x' : 'y'
    }
  } else {
    template = lengthOrTemplate || 'xxxxxxxx-xyxx-yxxx-xxxy-xxyxxxxxxxxx'
  }

  if (typeof radix !== 'number' || radix < 2 || radix > 36) {
    radix = 16
  }

  return template.replace(/[xy]/g, ch => {
    const value = (Math.random() * radix) | 0
    return (ch === 'x' ? value : (3 & value) | 8).toString(radix)
  })
}
