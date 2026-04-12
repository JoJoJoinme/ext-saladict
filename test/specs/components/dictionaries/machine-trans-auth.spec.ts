import { getDefaultConfig } from '@/app-config'
import { getDefaultProfile } from '@/app-config/profiles'
import { search as searchBaidu } from '@/components/dictionaries/baidu/engine'
import { search as searchCaiyun } from '@/components/dictionaries/caiyun/engine'
import { search as searchYoudaoTrans } from '@/components/dictionaries/youdaotrans/engine'

describe('machine translation auth requirements', () => {
  test('baidu returns requireCredential when no credential is configured', async () => {
    const config = getDefaultConfig()
    const profile = getDefaultProfile()

    const result = await searchBaidu('hello world', config, profile, {})

    expect(result.result?.requireCredential).toBe(true)
  })

  test('caiyun returns requireCredential when no credential is configured', async () => {
    const config = getDefaultConfig()
    const profile = getDefaultProfile()

    const result = await searchCaiyun('hello world', config, profile, {})

    expect(result.result?.requireCredential).toBe(true)
  })

  test('youdaotrans returns requireCredential when no credential is configured', async () => {
    const config = getDefaultConfig()
    const profile = getDefaultProfile()

    const result = await searchYoudaoTrans('hello world', config, profile, {})

    expect(result.result?.requireCredential).toBe(true)
  })
})
