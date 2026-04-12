import { UAParser } from 'ua-parser-js'
import { v4 as uuid } from 'uuid'
import { message, storage } from '@/_helpers/browser-api'
import { getConfig } from '@/_helpers/config-manager'
import { genUniqueKey } from '@/_helpers/uniqueKey'
import { GAEvent, GAEventBase } from './events'
import { isBackgroundPage } from '../saladict'

export type GAParams = { [key: string]: string }

export async function reportPageView(page: string): Promise<void> {
  const ua = new UAParser()
  const browser = ua.getBrowser()
  const os = ua.getOS()

  try {
    await requestGA({
      t: 'pageview',
      // required by pageview
      dp: page,
      // Dimensions
      cd1: browser.name || 'None',
      cd2: (browser.version || '0.0')
        .split('.')
        .slice(0, 3)
        .join('.'),
      cd3: os.name || 'None',
      cd4: os.version || '0.0',
      // Document Encoding
      de: 'UTF-8',
      // Document location URL
      dl: document.location.href,
      // Screen Colors
      sd: screen.colorDepth + '-bit',
      // Screen Resolution
      sr: screen.width + 'x' + screen.height,
      // User Language
      ul: 'zh-cn'
    })
  } catch (error) {
    if (!process.env.DEBUG) {
      console.error('Report pageview error', error)
    }
  }
}

export async function reportEvent(event: GAEvent) {
  const params: GAParams = {
    t: 'event',
    ec: event.category,
    ea: event.action
  }

  if ((event as GAEventBase).label != null) {
    params.el = (event as GAEventBase).label!
  }

  if ((event as GAEventBase).value != null) {
    params.ev = (event as GAEventBase).value!
  }

  try {
    await requestGA(params)
  } catch (error) {
    if (!process.env.DEBUG) {
      console.error('Report event error', error)
    }
  }
}

async function requestGA(extraParams: GAParams) {
  if (!isBackgroundPage()) {
    return message.send({
      type: 'REQUEST_GA',
      payload: extraParams
    })
  }

  const config = await getConfig().catch(() => null)
  if (config?.analytics === false) {
    return
  }

  if (
    process.env.DEBUG ||
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  ) {
    console.log('requestGA', extraParams)
    return
  }

  let cid = (await storage.sync.get<{ gacid: string }>('gacid')).gacid
  if (!cid) {
    cid = uuid()
    storage.sync.set({ gacid: cid })
  }

  return fetch('https://www.google-analytics.com/collect', {
    method: 'POST',
    headers: {
      'content-type': 'text/plain;charset=UTF-8'
    },
    body: new URLSearchParams({
      // required
      v: '1',
      tid: 'UA-49163616-4',
      cid,
      // Cache Buster
      z: genUniqueKey(),
      ...extraParams
    })
  })
}

export function setupRequestGAListener() {
  message.addListener('REQUEST_GA', ({ payload }) => {
    requestGA(payload)
  })
}
