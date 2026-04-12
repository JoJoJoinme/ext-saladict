import { AppConfig } from '@/app-config'
import { Profile } from '@/app-config/profiles'
import { Message } from '@/typings/message'

export type OffscreenFetchDictPayload = Message<'FETCH_DICT_RESULT'>['payload'] & {
  appConfig: AppConfig
  activeProfile: Profile
}
