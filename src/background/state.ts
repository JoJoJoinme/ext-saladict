/**
 * Module-scoped state for service worker.
 * Replaces window.appConfig, window.activeProfile, window.profileIDList
 * which are not available in MV3 service workers.
 *
 * Values are lazily loaded from storage and cached in module scope.
 * When the SW restarts, module scope resets to null and values reload on next access.
 */

import { AppConfig } from '@/app-config'
import { Profile, ProfileIDList } from '@/app-config/profiles'
import { getConfig } from '@/_helpers/config-manager'
import { getActiveProfile, getProfileIDList } from '@/_helpers/profile-manager'

let _appConfig: AppConfig | null = null
let _activeProfile: Profile | null = null
let _profileIDList: ProfileIDList | null = null

export async function getAppConfig(): Promise<AppConfig> {
  if (!_appConfig) {
    _appConfig = await getConfig()
  }
  return _appConfig
}

export function setAppConfig(config: AppConfig): void {
  _appConfig = config
}

export function getAppConfigSync(): AppConfig | null {
  return _appConfig
}

export async function getActiveProfileState(): Promise<Profile> {
  if (!_activeProfile) {
    _activeProfile = await getActiveProfile()
  }
  return _activeProfile
}

export function setActiveProfile(profile: Profile): void {
  _activeProfile = profile
}

export function getActiveProfileSync(): Profile | null {
  return _activeProfile
}

export async function getProfileIDListState(): Promise<ProfileIDList> {
  if (!_profileIDList) {
    _profileIDList = await getProfileIDList()
  }
  return _profileIDList
}

export function setProfileIDList(list: ProfileIDList): void {
  _profileIDList = list
}

export function getProfileIDListSync(): ProfileIDList | null {
  return _profileIDList
}

/**
 * Get screen dimensions using chrome.system.display API.
 * Replaces window.screen.availWidth/availHeight which are unavailable in SW.
 */
export interface ScreenInfo {
  availWidth: number
  availHeight: number
  availTop: number
  availLeft: number
}

let _screenInfo: ScreenInfo | null = null

export async function getScreenInfo(): Promise<ScreenInfo> {
  if (_screenInfo) return _screenInfo

  try {
    const displays = await chrome.system.display.getInfo()
    if (displays.length > 0) {
      const primary = displays.find(d => d.isPrimary) || displays[0]
      _screenInfo = {
        availWidth: primary.workArea.width,
        availHeight: primary.workArea.height,
        availTop: primary.workArea.top,
        availLeft: primary.workArea.left
      }
    }
  } catch (e) {
    console.warn('Failed to get display info:', e)
  }

  if (!_screenInfo) {
    // Fallback defaults
    _screenInfo = {
      availWidth: 1920,
      availHeight: 1080,
      availTop: 0,
      availLeft: 0
    }
  }

  return _screenInfo
}

/** Invalidate cached screen info (e.g. on display change) */
export function resetScreenInfo(): void {
  _screenInfo = null
}
