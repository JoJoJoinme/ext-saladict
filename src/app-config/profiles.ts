import { DeepReadonly } from '@/typings/helpers'
import { genUniqueKey } from '@/_helpers/uniqueKey'
import { getAllDicts } from './dicts'

export type MtaAutoUnfold = '' | 'once' | 'always' | 'popup' | 'hide'

export type ProfileMutable = ReturnType<typeof _getDefaultProfile>
export type Profile = DeepReadonly<ProfileMutable>

export interface ProfileID {
  id: string
  name: string
}

export type ProfileIDList = Array<ProfileID>

export const getDefaultProfile: (id?: string) => Profile = _getDefaultProfile

export default getDefaultProfile

const LEGACY_DEFAULT_SELECTED_DICTS = [
  'bing',
  'cobuild',
  'cambridge',
  'youdao',
  'urban',
  'vocabulary',
  'google',
  'caiyun',
  'youdaotrans',
  'zdic',
  'guoyu',
  'liangan',
  'googledict'
] as const

const MAINLAND_FRIENDLY_DEFAULT_SELECTED_DICTS = [
  'bing',
  'cambridge',
  'youdao',
  'vocabulary',
  'google',
  'zdic',
  'guoyu',
  'liangan'
] as const

export function _getDefaultProfile(id?: string) {
  const allDict = getAllDicts()
  // Default mode should prefer classic dictionary lookups for single words,
  // while routing phrases and long selections to Bing + machine translators.
  allDict.bing.selectionWC.max = 999999999999999
  allDict.cobuild.selectionWC.max = 1
  allDict.cambridge.selectionWC.max = 1
  allDict.youdao.selectionWC.max = 1
  allDict.urban.selectionWC.max = 1
  allDict.vocabulary.selectionWC.max = 1
  allDict.zdic.selectionWC.max = 1
  allDict.guoyu.selectionWC.max = 1
  allDict.liangan.selectionWC.max = 1
  allDict.googledict.selectionWC.max = 1
  allDict.google.selectionWC.min = 2
  allDict.caiyun.selectionWC.min = 2
  allDict.youdaotrans.selectionWC.min = 2

  return {
    version: 1,

    id: id || genUniqueKey(),

    /** auto unfold multiline textarea search box */
    mtaAutoUnfold: '' as MtaAutoUnfold,

    /** show waveform control panel */
    waveform: true,

    /** remember user manual dict folding on the same page */
    stickyFold: false,

    dicts: {
      /** default selected dictionaries */
      selected: [
        ...MAINLAND_FRIENDLY_DEFAULT_SELECTED_DICTS
      ] as Array<keyof ReturnType<typeof getAllDicts>>,
      // settings of each dict will be auto-generated
      all: allDict
    }
  }
}

function createSentenceProfile(id?: string): ProfileMutable {
  const profile = getDefaultProfile(id) as ProfileMutable
  profile.dicts.selected = [
    'jukuu',
    'bing',
    'cnki',
    'renren',
    'eudic',
    'cobuild',
    'cambridge',
    'longman',
    'macmillan'
  ]

  const allDict = profile.dicts.all
  allDict.jukuu.selectionWC.max = 999999999999999
  allDict.bing.selectionWC.max = 999999999999999
  allDict.cnki.selectionWC.max = 999999999999999
  allDict.renren.selectionWC.max = 999999999999999
  allDict.eudic.selectionWC.max = 999999999999999
  allDict.cobuild.selectionWC.max = 999999999999999
  allDict.cambridge.selectionWC.max = 999999999999999
  allDict.longman.selectionWC.max = 999999999999999
  allDict.macmillan.selectionWC.max = 999999999999999
  allDict.bing.options.tense = false
  allDict.bing.options.phsym = false
  allDict.bing.options.cdef = false
  allDict.bing.options.related = false
  allDict.bing.options.sentence = 9999
  allDict.cnki.options.dict = false
  allDict.eudic.options.resultnum = 9999
  allDict.macmillan.options.related = false
  allDict.longman.options.wordfams = false
  allDict.longman.options.collocations = false
  allDict.longman.options.grammar = false
  allDict.longman.options.thesaurus = false
  allDict.longman.options.examples = true
  allDict.longman.options.bussinessFirst = false
  allDict.longman.options.related = false

  return profile
}

function createScholarProfile(id?: string): ProfileMutable {
  const profile = getDefaultProfile(id) as ProfileMutable
  profile.dicts.selected = [
    'googledict',
    'cambridge',
    'cobuild',
    'etymonline',
    'cnki',
    'macmillan',
    'lexico',
    'websterlearner',
    'google',
    'youdaotrans',
    'zdic',
    'guoyu',
    'liangan'
  ]

  const allDict = profile.dicts.all
  allDict.macmillan.defaultUnfold = {
    matchAll: false,
    english: false,
    chinese: false,
    japanese: false,
    korean: false,
    french: false,
    spanish: false,
    deutsch: false,
    others: false
  }
  allDict.lexico.defaultUnfold = {
    matchAll: false,
    english: false,
    chinese: false,
    japanese: false,
    korean: false,
    french: false,
    spanish: false,
    deutsch: false,
    others: false
  }
  allDict.websterlearner.defaultUnfold = {
    matchAll: false,
    english: false,
    chinese: false,
    japanese: false,
    korean: false,
    french: false,
    spanish: false,
    deutsch: false,
    others: false
  }
  allDict.google.selectionWC.min = 5
  allDict.youdaotrans.selectionWC.min = 5

  return profile
}

function createTranslationProfile(id?: string): ProfileMutable {
  const profile = getDefaultProfile(id) as ProfileMutable
  profile.dicts.selected = [
    'google',
    'tencent',
    'baidu',
    'caiyun',
    'youdaotrans',
    'zdic',
    'guoyu',
    'liangan'
  ]
  profile.mtaAutoUnfold = 'always'
  profile.dicts.all.google.selectionWC.min = 1
  profile.dicts.all.tencent.selectionWC.min = 1
  profile.dicts.all.baidu.selectionWC.min = 1
  profile.dicts.all.caiyun.selectionWC.min = 1
  profile.dicts.all.youdaotrans.selectionWC.min = 1

  return profile
}

function createNihongoProfile(id?: string): ProfileMutable {
  const profile = getDefaultProfile(id) as ProfileMutable
  profile.dicts.selected = [
    'mojidict',
    'hjdict',
    'weblioejje',
    'weblio',
    'google',
    'tencent',
    'caiyun',
    'googledict',
    'wikipedia'
  ]
  profile.dicts.all.wikipedia.options.lang = 'ja'
  profile.waveform = false

  return profile
}

export function getPresetProfile(name: string, id?: string): Profile | undefined {
  switch (name) {
    case '%%_default_%%':
      return getDefaultProfile(id)
    case '%%_sentence_%%':
      return createSentenceProfile(id)
    case '%%_translation_%%':
      return createTranslationProfile(id)
    case '%%_scholar_%%':
      return createScholarProfile(id)
    case '%%_nihongo_%%':
      return createNihongoProfile(id)
    default:
      return undefined
  }
}

export function migratePresetProfile(
  name: string,
  profile: Profile
): Profile {
  const next = JSON.parse(JSON.stringify(profile)) as ProfileMutable

  if (name === '%%_default_%%') {
    if (
      next.dicts.selected.length === LEGACY_DEFAULT_SELECTED_DICTS.length &&
      next.dicts.selected.every(
        (id, index) => id === LEGACY_DEFAULT_SELECTED_DICTS[index]
      )
    ) {
      next.dicts.selected = [
        ...MAINLAND_FRIENDLY_DEFAULT_SELECTED_DICTS
      ] as ProfileMutable['dicts']['selected']
    }

    if (next.dicts.all.bing.selectionWC.max === 5) {
      next.dicts.all.bing.selectionWC.max = 999999999999999
    }
    if (next.dicts.all.cobuild.selectionWC.max === 5) {
      next.dicts.all.cobuild.selectionWC.max = 1
    }
    if (next.dicts.all.cambridge.selectionWC.max === 5) {
      next.dicts.all.cambridge.selectionWC.max = 1
    }
    if (next.dicts.all.youdao.selectionWC.max === 999999999999999) {
      next.dicts.all.youdao.selectionWC.max = 1
    }
    if (next.dicts.all.urban.selectionWC.max === 5) {
      next.dicts.all.urban.selectionWC.max = 1
    }
    if (next.dicts.all.vocabulary.selectionWC.max === 5) {
      next.dicts.all.vocabulary.selectionWC.max = 1
    }
    if (next.dicts.all.zdic.selectionWC.max === 5) {
      next.dicts.all.zdic.selectionWC.max = 1
    }
    if (next.dicts.all.guoyu.selectionWC.max === 5) {
      next.dicts.all.guoyu.selectionWC.max = 1
    }
    if (next.dicts.all.liangan.selectionWC.max === 5) {
      next.dicts.all.liangan.selectionWC.max = 1
    }
    if (next.dicts.all.googledict.selectionWC.max === 5) {
      next.dicts.all.googledict.selectionWC.max = 1
    }
    if (next.dicts.all.google.selectionWC.min === 5) {
      next.dicts.all.google.selectionWC.min = 2
    }
    if (next.dicts.all.caiyun.selectionWC.min === 1) {
      next.dicts.all.caiyun.selectionWC.min = 2
    }
    if (next.dicts.all.youdaotrans.selectionWC.min === 1) {
      next.dicts.all.youdaotrans.selectionWC.min = 2
    }
  }

  if (name === '%%_translation_%%') {
    if (next.dicts.all.google.selectionWC.min === 5) {
      next.dicts.all.google.selectionWC.min = 1
    }
  }

  return next
}

export function getDefaultProfileID(id?: string): ProfileID {
  return {
    id: id || genUniqueKey(),
    name: '%%_default_%%'
  }
}

export interface ProfileStorage {
  idItem: ProfileID
  profile: Profile
}

export function genProfilesStorage(): {
  profileIDList: ProfileIDList
  profiles: Profile[]
} {
  const defaultID = getDefaultProfileID()
  const defaultProfile = getDefaultProfile(defaultID.id)
  const sentenceStorage = sentence()
  const translationStorage = translation()
  const scholarStorage = scholar()
  const nihongoStorage = nihongo()

  return {
    profileIDList: [
      defaultID,
      sentenceStorage.idItem,
      translationStorage.idItem,
      scholarStorage.idItem,
      nihongoStorage.idItem
    ],
    profiles: [
      defaultProfile,
      sentenceStorage.profile,
      translationStorage.profile,
      scholarStorage.profile,
      nihongoStorage.profile
    ]
  }
}

export function sentence(): ProfileStorage {
  const idItem = getDefaultProfileID()
  idItem.name = '%%_sentence_%%'
  return { idItem, profile: createSentenceProfile(idItem.id) }
}

export function scholar(): ProfileStorage {
  const idItem = getDefaultProfileID()
  idItem.name = '%%_scholar_%%'
  return { idItem, profile: createScholarProfile(idItem.id) }
}

export function translation(): ProfileStorage {
  const idItem = getDefaultProfileID()
  idItem.name = '%%_translation_%%'
  return { idItem, profile: createTranslationProfile(idItem.id) }
}

export function nihongo(): ProfileStorage {
  const idItem = getDefaultProfileID()
  idItem.name = '%%_nihongo_%%'
  return { idItem, profile: createNihongoProfile(idItem.id) }
}
