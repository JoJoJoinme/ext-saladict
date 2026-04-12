/**
 * Unit tests for src/background/offscreen-helper.ts
 * Tests the hidden MV3 offscreen document lifecycle helper.
 */

let offscreenHelper: typeof import('@/background/offscreen-helper')

const mockGetContexts = jest.fn()
const mockCreateDocument = jest.fn()
const mockGetURL = jest.fn((path: string) => 'chrome-extension://test-id/' + path)
const mockSendMessage = jest.fn()

describe('Offscreen Helper', () => {
  beforeEach(() => {
    jest.resetModules()
    mockGetContexts.mockReset()
    mockCreateDocument.mockReset()
    mockSendMessage.mockReset()

    ;(global as any).chrome = {
      runtime: {
        getURL: mockGetURL,
        getContexts: mockGetContexts,
        sendMessage: mockSendMessage
      },
      offscreen: {
        createDocument: mockCreateDocument
      }
    }

    offscreenHelper = require('@/background/offscreen-helper')
  })

  it('should create hidden offscreen document when none exists', async () => {
    mockGetContexts.mockResolvedValue([])
    mockCreateDocument.mockResolvedValue(undefined)

    await offscreenHelper.ensureOffscreenDocument()

    expect(mockGetContexts).toHaveBeenCalledTimes(1)
    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'offscreen.html',
        reasons: expect.arrayContaining([
          'AUDIO_PLAYBACK',
          'CLIPBOARD',
          'DOM_PARSER'
        ])
      })
    )
  })

  it('should not create hidden offscreen document when one already exists', async () => {
    mockGetContexts.mockResolvedValue([{ documentUrl: mockGetURL('offscreen.html') }])

    await offscreenHelper.ensureOffscreenDocument()

    expect(mockGetContexts).toHaveBeenCalledTimes(1)
    expect(mockCreateDocument).not.toHaveBeenCalled()
  })

  it('should deduplicate concurrent creation calls', async () => {
    mockGetContexts.mockResolvedValue([])

    let resolveCreate!: () => void
    mockCreateDocument.mockReturnValue(
      new Promise<void>(resolve => { resolveCreate = resolve })
    )

    const p1 = offscreenHelper.ensureOffscreenDocument()
    const p2 = offscreenHelper.ensureOffscreenDocument()

    // Second call should see the creating promise and wait
    resolveCreate!()
    await Promise.all([p1, p2])

    expect(mockCreateDocument).toHaveBeenCalledTimes(1)
  })

  it('should send requests through chrome.runtime messaging', async () => {
    mockGetContexts.mockResolvedValue([{ documentUrl: mockGetURL('offscreen.html') }])
    mockSendMessage
      .mockResolvedValueOnce('pong')
      .mockResolvedValueOnce(undefined)

    await offscreenHelper.requestOffscreen('STOP_AUDIO', undefined)

    expect(mockSendMessage).toHaveBeenCalledTimes(2)
    expect(mockSendMessage.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        target: 'offscreen',
        type: 'OFFSCREEN_PING',
        payload: undefined
      })
    )
    expect(mockSendMessage.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        target: 'offscreen',
        type: 'OFFSCREEN_STOP_AUDIO',
        payload: undefined
      })
    )
  })
})
