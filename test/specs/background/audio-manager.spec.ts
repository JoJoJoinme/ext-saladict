/**
 * Unit tests for src/background/audio-manager.ts (MV3 version)
 * Audio playback is now delegated to offscreen document via messages
 */

jest.mock('@/background/offscreen-helper', () => ({
  requestOffscreen: jest.fn(() => Promise.resolve())
}))

import { AudioManager } from '@/background/audio-manager'
import { requestOffscreen } from '@/background/offscreen-helper'

describe('AudioManager (MV3)', () => {
  let audioManager: AudioManager

  beforeEach(() => {
    // Access singleton - need to reset its state
    audioManager = AudioManager.getInstance()
    audioManager.currentSrc = undefined
    ;(requestOffscreen as jest.Mock).mockClear()
  })

  it('should be a singleton', () => {
    const instance1 = AudioManager.getInstance()
    const instance2 = AudioManager.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should play audio via offscreen document', async () => {
    const url = 'https://example.com/audio.mp3'
    await audioManager.play(url)

    expect(requestOffscreen).toHaveBeenCalledTimes(1)
    expect(requestOffscreen).toHaveBeenCalledWith('PLAY_AUDIO', url)
  })

  it('should reset currentSrc after playing', async () => {
    const url = 'https://example.com/audio.mp3'
    await audioManager.play(url)
    expect(audioManager.currentSrc).toBe('')
  })

  it('should reset when playing same src', async () => {
    audioManager.currentSrc = 'https://example.com/same.mp3'
    await audioManager.play('https://example.com/same.mp3')

    // Should send stop, not play
    expect(requestOffscreen).toHaveBeenCalledWith('STOP_AUDIO', undefined)
  })

  it('should reset when called with no src', async () => {
    await audioManager.play()

    expect(requestOffscreen).toHaveBeenCalledWith('STOP_AUDIO', undefined)
  })

  it('should stop audio on reset', () => {
    audioManager.reset()

    expect(audioManager.currentSrc).toBe('')
    expect(requestOffscreen).toHaveBeenCalledWith('STOP_AUDIO', undefined)
  })
})
