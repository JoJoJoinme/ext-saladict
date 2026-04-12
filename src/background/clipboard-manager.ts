import { openUrl } from '@/_helpers/browser-api'
import { requestOffscreen } from './offscreen-helper'

export async function copyTextToClipboard(text: string): Promise<void> {
  if (
    !(await browser.permissions.contains({ permissions: ['clipboardWrite'] }))
  ) {
    openUrl(
      '/options.html?menuselected=Permissions&missing_permission=clipboardWrite',
      true
    )
    return
  }

  await requestOffscreen('COPY_TEXT', text)
}

export async function getTextFromClipboard(): Promise<string> {
  if (
    !(await browser.permissions.contains({ permissions: ['clipboardRead'] }))
  ) {
    openUrl(
      '/options.html?menuselected=Permissions&missing_permission=clipboardRead',
      true
    )
    return ''
  }

  if (process.env.NODE_ENV === 'development') {
    return 'clipboard content'
  }

  return (await requestOffscreen('PASTE_TEXT', undefined)) || ''
}
