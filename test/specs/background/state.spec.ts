/**
 * Unit tests for src/background/state.ts
 * Tests the module-scoped state management that replaced window.* globals
 */

// Mock dependencies before importing
jest.mock('@/_helpers/config-manager', () => ({
  getConfig: jest.fn()
}))
jest.mock('@/_helpers/profile-manager', () => ({
  getActiveProfile: jest.fn(),
  getProfileIDList: jest.fn()
}))

// Mock chrome.system.display
const mockGetInfo = jest.fn()
;(global as any).chrome = {
  ...(global as any).chrome,
  system: {
    display: {
      getInfo: mockGetInfo
    }
  }
}

import { getDefaultConfig } from '@/app-config'
import getDefaultProfile, { getDefaultProfileID } from '@/app-config/profiles'

let state: typeof import('@/background/state')
let configManager: { getConfig: jest.Mock }
let profileManager: { getActiveProfile: jest.Mock; getProfileIDList: jest.Mock }

describe('Background State', () => {
  beforeEach(() => {
    jest.resetModules()

    // Re-require after reset to get fresh module scope
    configManager = require('@/_helpers/config-manager')
    profileManager = require('@/_helpers/profile-manager')
    state = require('@/background/state')

    mockGetInfo.mockReset()
  })

  describe('AppConfig', () => {
    it('should lazy-load config from storage on first access', async () => {
      const defaultConfig = getDefaultConfig()
      configManager.getConfig.mockResolvedValue(defaultConfig)

      const config = await state.getAppConfig()
      expect(configManager.getConfig).toHaveBeenCalledTimes(1)
      expect(config).toBe(defaultConfig)
    })

    it('should return cached config on subsequent access', async () => {
      const defaultConfig = getDefaultConfig()
      configManager.getConfig.mockResolvedValue(defaultConfig)

      await state.getAppConfig()
      await state.getAppConfig()
      expect(configManager.getConfig).toHaveBeenCalledTimes(1)
    })

    it('should update config via setAppConfig', async () => {
      const defaultConfig = getDefaultConfig()
      configManager.getConfig.mockResolvedValue(defaultConfig)

      await state.getAppConfig()

      const newConfig = { ...defaultConfig, active: false }
      state.setAppConfig(newConfig as any)

      const config = await state.getAppConfig()
      expect(config).toBe(newConfig)
      // Should not call getConfig again since cache was set
      expect(configManager.getConfig).toHaveBeenCalledTimes(1)
    })

    it('should return null from sync getter when not loaded', () => {
      expect(state.getAppConfigSync()).toBeNull()
    })

    it('should return value from sync getter after loading', async () => {
      const defaultConfig = getDefaultConfig()
      configManager.getConfig.mockResolvedValue(defaultConfig)

      await state.getAppConfig()
      expect(state.getAppConfigSync()).toBe(defaultConfig)
    })
  })

  describe('ActiveProfile', () => {
    it('should lazy-load profile from storage', async () => {
      const defaultProfile = getDefaultProfile()
      profileManager.getActiveProfile.mockResolvedValue(defaultProfile)

      const profile = await state.getActiveProfileState()
      expect(profileManager.getActiveProfile).toHaveBeenCalledTimes(1)
      expect(profile).toBe(defaultProfile)
    })

    it('should cache profile after first load', async () => {
      const defaultProfile = getDefaultProfile()
      profileManager.getActiveProfile.mockResolvedValue(defaultProfile)

      await state.getActiveProfileState()
      await state.getActiveProfileState()
      expect(profileManager.getActiveProfile).toHaveBeenCalledTimes(1)
    })

    it('should update via setActiveProfile', async () => {
      const defaultProfile = getDefaultProfile()
      profileManager.getActiveProfile.mockResolvedValue(defaultProfile)

      const newProfile = { ...defaultProfile, name: 'custom' }
      state.setActiveProfile(newProfile as any)

      const profile = await state.getActiveProfileState()
      expect(profile).toBe(newProfile)
      expect(profileManager.getActiveProfile).not.toHaveBeenCalled()
    })
  })

  describe('ProfileIDList', () => {
    it('should lazy-load profile ID list from storage', async () => {
      const mockList = [getDefaultProfileID()]
      profileManager.getProfileIDList.mockResolvedValue(mockList)

      const list = await state.getProfileIDListState()
      expect(profileManager.getProfileIDList).toHaveBeenCalledTimes(1)
      expect(list).toBe(mockList)
    })

    it('should update via setProfileIDList', () => {
      const mockList = [getDefaultProfileID()]
      state.setProfileIDList(mockList as any)
      expect(state.getProfileIDListSync()).toBe(mockList)
    })
  })

  describe('ScreenInfo', () => {
    it('should fetch from chrome.system.display.getInfo', async () => {
      mockGetInfo.mockResolvedValue([{
        isPrimary: true,
        workArea: { width: 2560, height: 1440, top: 0, left: 0 }
      }])

      const info = await state.getScreenInfo()
      expect(mockGetInfo).toHaveBeenCalledTimes(1)
      expect(info).toEqual({
        availWidth: 2560,
        availHeight: 1440,
        availTop: 0,
        availLeft: 0
      })
    })

    it('should cache screen info after first call', async () => {
      mockGetInfo.mockResolvedValue([{
        isPrimary: true,
        workArea: { width: 1920, height: 1080, top: 0, left: 0 }
      }])

      await state.getScreenInfo()
      await state.getScreenInfo()
      expect(mockGetInfo).toHaveBeenCalledTimes(1)
    })

    it('should use primary display when multiple displays exist', async () => {
      mockGetInfo.mockResolvedValue([
        {
          isPrimary: false,
          workArea: { width: 1280, height: 720, top: 0, left: 0 }
        },
        {
          isPrimary: true,
          workArea: { width: 3840, height: 2160, top: 0, left: 1280 }
        }
      ])

      const info = await state.getScreenInfo()
      expect(info.availWidth).toBe(3840)
      expect(info.availHeight).toBe(2160)
    })

    it('should fallback to defaults when API fails', async () => {
      mockGetInfo.mockRejectedValue(new Error('API unavailable'))

      const info = await state.getScreenInfo()
      expect(info).toEqual({
        availWidth: 1920,
        availHeight: 1080,
        availTop: 0,
        availLeft: 0
      })
    })

    it('should invalidate cache on resetScreenInfo', async () => {
      mockGetInfo.mockResolvedValue([{
        isPrimary: true,
        workArea: { width: 1920, height: 1080, top: 0, left: 0 }
      }])

      await state.getScreenInfo()
      state.resetScreenInfo()

      mockGetInfo.mockResolvedValue([{
        isPrimary: true,
        workArea: { width: 2560, height: 1440, top: 0, left: 0 }
      }])

      const info = await state.getScreenInfo()
      expect(mockGetInfo).toHaveBeenCalledTimes(2)
      expect(info.availWidth).toBe(2560)
    })
  })
})
