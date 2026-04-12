import { requestOffscreen } from './offscreen-helper'

/**
 * To make sure only one audio plays at a time.
 * In MV3, audio playback is delegated to the offscreen document.
 */
export class AudioManager {
  private static instance: AudioManager

  static getInstance() {
    return AudioManager.instance || (AudioManager.instance = new AudioManager())
  }

  // singleton
  // eslint-disable-next-line no-useless-constructor
  private constructor() {}

  currentSrc?: string

  reset() {
    this.currentSrc = ''
    requestOffscreen('STOP_AUDIO', undefined).catch(() => undefined)
  }

  async play(src?: string): Promise<void> {
    if (!src || src === this.currentSrc) {
      this.reset()
      return
    }

    this.currentSrc = src
    await requestOffscreen('PLAY_AUDIO', src)
    this.currentSrc = ''
  }
}
