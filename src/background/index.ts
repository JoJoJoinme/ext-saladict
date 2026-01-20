import './env'
import './initialization'
import { getConfig, addConfigListener } from '@/_helpers/config-manager'
import {
  createActiveProfileStream,
  createProfileIDListStream
} from '@/_helpers/profile-manager'
import { message } from '@/_helpers/browser-api'
import { startSyncServiceInterval } from './sync-manager'
import { init as initPdf } from './pdf-sniffer'
import { ContextMenus } from './context-menus'
import { BackgroundServer } from './server'
import { initBadge } from './badge'
import { setupCaiyunTrsBackend } from './page-translate/caiyun'
import { setupRequestGAListener } from '@/_helpers/analytics'
import './types'

// init first to recevice self messaging
message.self.initServer()

startSyncServiceInterval()

ContextMenus.init()
BackgroundServer.init()

setupCaiyunTrsBackend()

setupRequestGAListener()

// Initialize Offscreen
if (typeof chrome !== 'undefined' && chrome.offscreen) {
  chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [
      chrome.offscreen.Reason.AUDIO_PLAYBACK,
      chrome.offscreen.Reason.DOM_PARSER,
      chrome.offscreen.Reason.CLIPBOARD
    ],
    justification: 'Play audio, parse XML, and access clipboard'
  }).catch(e => {
    if (!e.message.includes('Only a single offscreen')) {
      console.error('Failed to create offscreen document:', e)
    }
  })
}

const g = self as any

getConfig().then(async config => {
  g.appConfig = config
  initPdf(config)
  initBadge()

  addConfigListener(({ newConfig }) => {
    g.appConfig = newConfig
  })
})

createActiveProfileStream().subscribe(profile => {
  g.activeProfile = profile
})

createProfileIDListStream().subscribe(list => {
  g.profileIDList = list
})
