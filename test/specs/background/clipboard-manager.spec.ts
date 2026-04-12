/**
 * Unit tests for src/background/clipboard-manager.ts (MV3 version)
 * Clipboard operations delegated to offscreen document
 */

jest.mock('@/background/offscreen-helper', () => ({
  requestOffscreen: jest.fn()
}))

jest.mock('@/_helpers/browser-api', () => ({
  openUrl: jest.fn(() => Promise.resolve())
}))

const mockPermissionsContains = jest.fn()

// browser.permissions mock
;(window as any).browser = {
  ...(window as any).browser,
  permissions: {
    contains: mockPermissionsContains
  }
}

import { copyTextToClipboard, getTextFromClipboard } from '@/background/clipboard-manager'
import { requestOffscreen } from '@/background/offscreen-helper'
import { openUrl } from '@/_helpers/browser-api'

describe('Clipboard Manager (MV3)', () => {
  beforeEach(() => {
    mockPermissionsContains.mockReset()
    ;(requestOffscreen as jest.Mock).mockReset()
    ;(openUrl as jest.Mock).mockClear()
  })

  describe('copyTextToClipboard', () => {
    it('should copy text via offscreen document when permission granted', async () => {
      mockPermissionsContains.mockResolvedValue(true)
      ;(requestOffscreen as jest.Mock).mockResolvedValue(undefined)

      await copyTextToClipboard('hello world')

      expect(requestOffscreen).toHaveBeenCalledWith('COPY_TEXT', 'hello world')
    })

    it('should open options page when permission denied', async () => {
      mockPermissionsContains.mockResolvedValue(false)

      await copyTextToClipboard('hello')

      expect(requestOffscreen).not.toHaveBeenCalled()
      expect(openUrl).toHaveBeenCalledWith(
        expect.stringContaining('clipboardWrite'),
        true
      )
    })
  })

  describe('getTextFromClipboard', () => {
    it('should read clipboard via offscreen document when permission granted', async () => {
      mockPermissionsContains.mockResolvedValue(true)
      ;(requestOffscreen as jest.Mock).mockResolvedValue('pasted text')

      const result = await getTextFromClipboard()

      expect(requestOffscreen).toHaveBeenCalledWith('PASTE_TEXT', undefined)
      expect(result).toBe('pasted text')
    })

    it('should return empty string when permission denied', async () => {
      mockPermissionsContains.mockResolvedValue(false)

      const result = await getTextFromClipboard()

      expect(result).toBe('')
      expect(openUrl).toHaveBeenCalledWith(
        expect.stringContaining('clipboardRead'),
        true
      )
    })

    it('should return empty string when sendMessage returns null', async () => {
      mockPermissionsContains.mockResolvedValue(true)
      ;(requestOffscreen as jest.Mock).mockResolvedValue(null)

      const result = await getTextFromClipboard()
      expect(result).toBe('')
    })
  })
})
