/** Pages with the Saladict extension domain */
const runtime = globalThis as typeof globalThis & Window

export const isBackgroundPage = () => !!runtime.__SALADICT_BACKGROUND_PAGE__

export const isInternalPage = () => !!runtime.__SALADICT_INTERNAL_PAGE__

export const isOptionsPage = () => !!runtime.__SALADICT_OPTIONS_PAGE__

export const isPopupPage = () => !!runtime.__SALADICT_POPUP_PAGE__

export const isPDFPage = () => !!runtime.__SALADICT_PDF_PAGE__

export const isQuickSearchPage = () => !!runtime.__SALADICT_QUICK_SEARCH_PAGE__

/** Dict panel is in a standalone window */
export const isStandalonePage = () => isPopupPage() || isQuickSearchPage()

/** do not record search history on these pages */
export const isNoSearchHistoryPage = () =>
  isInternalPage() && !isStandalonePage()

export const SALADICT_EXTERNAL = 'saladict-external'

export const SALADICT_PANEL = 'saladict-panel'

const userAgent = runtime.navigator?.userAgent || ''
const vendor = runtime.navigator?.vendor || ''

export const isFirefox = userAgent.includes('Firefox')
export const isOpera = userAgent.includes('OPR')
export const isSafari = /apple/i.test(vendor)

/**
 * Is element in a Saladict external element
 */
export function isInSaladictExternal(
  element: Element | EventTarget | null
): boolean {
  if (!element) {
    return false
  }

  for (let el: Element | null = element as Element; el; el = el.parentElement) {
    if (el.classList && el.classList.contains(SALADICT_EXTERNAL)) {
      return true
    }
  }

  return false
}

/**
 * Is element in Saladict Dict Panel
 */
export function isInDictPanel(element: Node | EventTarget | null): boolean {
  if (!element) {
    return false
  }

  for (let el: Element | null = element as Element; el; el = el.parentElement) {
    if (el.classList && el.classList.contains(SALADICT_PANEL)) {
      return true
    }
  }

  return false
}
