import { message } from '@/_helpers/browser-api'
import { Message } from '@/typings/message'

console.log('OFFSCREEN_ENTRY_POINT')

let audio: HTMLAudioElement | null = null

message.addListener('PLAY_AUDIO', (msg: Message<'PLAY_AUDIO'>) => {
  const { payload } = msg
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
  if (payload) {
    audio = new Audio(payload)
    audio.play().catch(console.error)
  }
})

message.addListener('STOP_AUDIO', () => {
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
})

message.addListener('PARSE_XML_WEBDAV', (msg: Message<'PARSE_XML_WEBDAV'>) => {
  const { payload } = msg
  try {
    const doc = new DOMParser().parseFromString(payload, 'text/xml')
    const $responses = Array.from(doc.querySelectorAll('response'))
    for (const i in $responses) {
      const href = $responses[i].querySelector('href')
      if (href && href.textContent && href.textContent.endsWith('/Saladict/')) {
        // is Saladict
        if ($responses[i].querySelector('resourcetype collection')) {
          // is collection
          return true
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
  return false
})

message.addListener('SET_CLIPBOARD', (msg: Message<'SET_CLIPBOARD'>) => {
  const { payload } = msg
  const el = document.createElement('textarea')
  el.value = payload
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
})

message.addListener('GET_CLIPBOARD', () => {
  const el = document.createElement('textarea')
  document.body.appendChild(el)
  el.focus()
  document.execCommand('paste')
  const val = el.value
  document.body.removeChild(el)
  return val
})
