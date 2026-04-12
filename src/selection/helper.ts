import { AppConfig } from '@/app-config'
import { Observable, fromEvent, merge, of } from 'rxjs'
import { map, mapTo, filter, distinctUntilChanged } from 'rxjs/operators'
import { newWord, Word } from '@/_helpers/record-manager'
import { isTagName } from '@/_helpers/dom'

const isMac = /mac/i.test(navigator.platform)

/**
 * Is quick search key pressed(command on mac, ctrl on others)
 */
export function isQSKey(evt: KeyboardEvent): boolean {
  return isMac ? evt.key === 'Meta' : evt.key === 'Control'
}

/**
 * Is esc button pressed
 */
export function isEscapeKey(evt: KeyboardEvent): boolean {
  return evt.key === 'Escape'
}

export function whenKeyPressed(
  keySelectior: (e: KeyboardEvent) => boolean
): Observable<true> {
  return merge(
    map(keySelectior)(
      fromEvent<KeyboardEvent>(window, 'keydown', { capture: true })
    ),
    mapTo(false)(fromEvent(window, 'keyup', { capture: true })),
    mapTo(false)(fromEvent(window, 'blur', { capture: true })),
    of(false)
  ).pipe(
    distinctUntilChanged(), // ignore long press
    filter((x): x is true => x)
  )
}

// common editors
const editorTester = /CodeMirror|ace_editor|monaco-editor/

export function isTypeField(element: Node | EventTarget | null): boolean {
  if (!element || !element['tagName']) {
    return false
  }

  for (
    let el: HTMLElement | null = element as HTMLElement;
    el;
    el = el.parentElement
  ) {
    if (
      isTagName(el, 'input') ||
      isTagName(el, 'textarea') ||
      el.isContentEditable
    ) {
      return true
    }

    // With CodeMirror the `pre.CodeMirror-line` somehow got detached when the event
    // triggerd. So el will never reach the root `.CodeMirror`.
    if (editorTester.test(String(el.className))) {
      return true
    }
  }

  return false
}

export function isBlacklisted(config: AppConfig): boolean {
  const url = window.pageURL || document.URL || ''
  if (!url) {
    return false
  }
  return (
    config.blacklist.some(([r]) => new RegExp(r).test(url)) &&
    config.whitelist.every(([r]) => !new RegExp(r).test(url))
  )
}

export async function newSelectionWord(
  word: Partial<Word> = {}
): Promise<Word> {
  return Promise.resolve(newSelectionWordLocal(word))
}

export function newSelectionWordLocal(word: Partial<Word> = {}): Word {
  return newWord({
    title: document.title || '',
    url: document.URL || '',
    favicon: getPageFaviconURL(),
    ...word
  })
}

function getPageFaviconURL(): string {
  if (window.faviconURL) {
    return window.faviconURL
  }

  const icon = document.querySelector<HTMLLinkElement>(
    'link[rel~="icon"], link[rel="shortcut icon"]'
  )
  return icon?.href || ''
}
