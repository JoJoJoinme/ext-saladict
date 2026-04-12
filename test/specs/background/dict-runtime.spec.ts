import {
  buildHjdictCookies,
  ensureZdicAudioRefererRule,
  prepareDictionaryRuntime,
  seedHjdictCookies
} from '@/background/dict-runtime'
import getDefaultProfile, { ProfileMutable } from '@/app-config/profiles'

describe('background/dict-runtime', () => {
  beforeEach(() => {
    ;(chrome.declarativeNetRequest.updateSessionRules as jest.Mock).mockClear()
    browser.cookies.set.resetHistory()
  })

  it('installs ZDIC audio referer rule in background', async () => {
    await ensureZdicAudioRefererRule()

    expect(chrome.declarativeNetRequest.updateSessionRules).toHaveBeenCalledWith({
      removeRuleIds: [1001],
      addRules: [
        expect.objectContaining({
          id: 1001,
          action: expect.objectContaining({
            type: 'modifyHeaders',
            requestHeaders: [
              expect.objectContaining({
                header: 'Referer',
                operation: 'set',
                value: 'https://www.zdic.net'
              })
            ]
          }),
          condition: expect.objectContaining({
            urlFilter: 'https://img.zdic.net/audio/*',
            resourceTypes: ['media', 'xmlhttprequest']
          })
        })
      ]
    })
  })

  it('seeds HJDict cookies in background', async () => {
    await seedHjdictCookies()

    expect(browser.cookies.set.called).toBeTruthy()
    expect(
      browser.cookies.set.calledWithMatch({
        url: 'https://www.hjdict.com',
        domain: 'hjdict.com'
      })
    ).toBeTruthy()
  })

  it('builds HJDict cookies without extension side effects', () => {
    const cookies = buildHjdictCookies()

    expect(cookies.HJ_SITEID).toBe(3)
    expect(typeof cookies.HJ_UID).toBe('string')
    expect(typeof cookies.HJ_T).toBe('number')
  })

  it('only prepares ZDIC audio rule when audio is enabled', async () => {
    const profile = getDefaultProfile() as ProfileMutable
    profile.dicts.all.zdic.options.audio = false

    await prepareDictionaryRuntime('zdic', profile)

    expect(chrome.declarativeNetRequest.updateSessionRules).not.toHaveBeenCalled()
  })

  it('prepares HJDict cookies before hidden-offscreen searches', async () => {
    const profile = getDefaultProfile()

    await prepareDictionaryRuntime('hjdict', profile)

    expect(browser.cookies.set.called).toBeTruthy()
  })
})
