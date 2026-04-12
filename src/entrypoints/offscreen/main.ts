/**
 * Hidden MV3 offscreen document for audio playback, clipboard operations,
 * and DOM-capable dictionary helper work.
 */

import { timeout, timer } from '@/_helpers/promise-more'
import { DictID } from '@/app-config'
import {
  DictSearchResult,
  GetSrcPageFunction,
  LookupErrorType,
  SearchFunction
} from '@/components/dictionaries/helpers'
import { Message, MessageResponse } from '@/typings/message'
import { OffscreenFetchDictPayload } from '@/background/offscreen-contract'

let currentAudio: HTMLAudioElement | undefined
let currentSrc = ''

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (
    message?.target !== 'offscreen' ||
    typeof message?.type !== 'string' ||
    !message.type.startsWith('OFFSCREEN_')
  ) {
    return false
  }

  dispatchOffscreenRequest(message.type, message.payload)
    .then(sendResponse)
    .catch(error => {
      if (message.type === 'OFFSCREEN_FETCH_DICT_RESULT') {
        sendResponse({
          id: message.payload?.id,
          result: null
        })
        return
      }

      throw error
    })
    .catch(() => sendResponse())

  return true
})

async function dispatchOffscreenRequest(type: string, payload: any) {
  switch (type) {
    case 'OFFSCREEN_PING':
      return 'pong'

    case 'OFFSCREEN_PLAY_AUDIO':
      return handlePlayAudio(payload)

    case 'OFFSCREEN_STOP_AUDIO':
      handleStopAudio()
      return undefined

    case 'OFFSCREEN_COPY_TEXT':
      handleCopyText(payload)
      return undefined

    case 'OFFSCREEN_PASTE_TEXT':
      return handlePasteText()

    case 'OFFSCREEN_FETCH_DICT_RESULT':
      return handleFetchDictResult(payload).catch(() => ({
        id: payload.id,
        result: null
      }))

    case 'OFFSCREEN_DICT_ENGINE_METHOD':
      return handleDictEngineMethod(payload)
  }

  throw new Error(`Unknown offscreen request: ${type}`)
}

async function getDictEngine<P = {}>(
  id: DictID
): Promise<{
  search: SearchFunction<DictSearchResult<any>, P>
  getSrcPage: GetSrcPageFunction
}> {
  return import(
    /* webpackInclude: /engine\.ts$/ */
    /* webpackMode: "lazy" */
    `@/components/dictionaries/${id}/engine.ts`
  )
}

async function handleFetchDictResult(
  data: OffscreenFetchDictPayload
): Promise<MessageResponse<'FETCH_DICT_RESULT'>> {
  const payload = data.payload || {}

  let response: DictSearchResult<any> | undefined
  let errorType: LookupErrorType | undefined

  try {
    const { search } = await getDictEngine<NonNullable<typeof data['payload']>>(
      data.id
    )

    try {
      response = await timeout(
        search(data.text, data.appConfig, data.activeProfile, payload),
        25000
      )
    } catch (e) {
      if ((e as Error).message === 'NETWORK_ERROR') {
        await timer(500)
        response = await timeout(
          search(data.text, data.appConfig, data.activeProfile, payload),
          25000
        )
      } else {
        throw e
      }
    }
  } catch (e) {
    if (process.env.DEBUG) {
      console.warn(data.id, e)
    }
    const message = (e as Error).message
    errorType =
      message === 'NO_RESULT' || message === 'NETWORK_ERROR'
        ? message
        : 'UNKNOWN_ERROR'
  }

  const result = response
    ? { ...response, id: data.id }
    : { result: null, id: data.id, errorType }

  if (process.env.DEBUG) {
    console.log(`Search Engine ${data.id}`, data.text, result)
  }

  return result
}

async function handleDictEngineMethod(
  data: Message<'DICT_ENGINE_METHOD'>['payload']
) {
  const engine = await getDictEngine(data.id)
  return engine[data.method](...(data.args || []))
}

async function handlePlayAudio(src: string): Promise<void> {
  if (!src || src === currentSrc) {
    handleStopAudio()
    return
  }

  handleStopAudio()
  currentSrc = src
  currentAudio = new Audio(src)

  const onEnd = Promise.race([
    new Promise<void>(resolve => {
      currentAudio!.onended = () => resolve()
    }),
    new Promise<void>(resolve => setTimeout(resolve, 20000))
  ])

  await currentAudio.play()
  await onEnd
  currentSrc = ''
}

function handleStopAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio.src = ''
    currentAudio.onended = null
  }
  currentSrc = ''
}

function handleCopyText(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.textContent = text
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.blur()
  document.body.removeChild(textarea)
}

function handlePasteText(): string {
  let el = document.getElementById('saladict-paste') as HTMLTextAreaElement | null
  if (!el) {
    el = document.createElement('textarea')
    el.id = 'saladict-paste'
    document.body.appendChild(el)
  }
  el.value = ''
  el.focus()
  document.execCommand('paste')
  return el.value || ''
}
