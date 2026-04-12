import { timer, timeout } from '@/_helpers/promise-more'

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html'
const OFFSCREEN_CONNECT_TIMEOUT = 5000
const OFFSCREEN_REASONS: chrome.offscreen.Reason[] = [
  'AUDIO_PLAYBACK',
  'CLIPBOARD',
  'DOM_PARSER'
]

type OffscreenRequestType =
  | 'PLAY_AUDIO'
  | 'STOP_AUDIO'
  | 'COPY_TEXT'
  | 'PASTE_TEXT'
  | 'FETCH_DICT_RESULT'
  | 'DICT_ENGINE_METHOD'

type OffscreenMessageType = `OFFSCREEN_${OffscreenRequestType | 'PING'}`

type OffscreenRequestMessage = {
  target: 'offscreen'
  type: OffscreenMessageType
  payload?: any
}

let creatingOffscreenDocument: Promise<void> | undefined

async function hasOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  })

  return contexts.some(context => context.documentUrl === offscreenUrl)
}

export async function ensureOffscreenDocument(): Promise<void> {
  if (creatingOffscreenDocument) {
    return creatingOffscreenDocument
  }

  creatingOffscreenDocument = Promise.resolve()
    .then(async () => {
      if (await hasOffscreenDocument()) {
        return
      }

      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: OFFSCREEN_REASONS,
        justification:
          'Saladict needs a hidden document for audio, clipboard, and dictionary DOM parsing.'
      })
    })
    .finally(() => {
      creatingOffscreenDocument = undefined
    })

  return creatingOffscreenDocument
}

async function sendOffscreenRequest<T>(
  type: OffscreenMessageType,
  payload: any,
  timeoutMs: number
): Promise<T> {
  return timeout(
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type,
      payload
    } as OffscreenRequestMessage) as Promise<T>,
    timeoutMs
  )
}

async function waitForOffscreenReady(
  timeoutMs = OFFSCREEN_CONNECT_TIMEOUT
): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const pong = await sendOffscreenRequest<string>(
        'OFFSCREEN_PING',
        undefined,
        250
      )
      if (pong === 'pong') {
        return
      }
    } catch (_error) {
      // The hidden document may still be booting. Retry until the connect timeout.
    }

    if (!(await hasOffscreenDocument())) {
      await ensureOffscreenDocument()
    }

    await timer(100)
  }

  throw new Error(
    `Timed out waiting for offscreen ready after ${timeoutMs}ms`
  )
}

export async function requestOffscreen<T = any>(
  type: OffscreenRequestType,
  payload: any,
  timeoutMs = 10000
): Promise<T> {
  await ensureOffscreenDocument()
  await waitForOffscreenReady()
  return sendOffscreenRequest<T>(`OFFSCREEN_${type}`, payload, timeoutMs)
}
