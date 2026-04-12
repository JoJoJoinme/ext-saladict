import fs from 'fs'
import path from 'path'

const specPath = path.resolve('test/acceptance/spec.json')
const fixtureDir = path.resolve('test/acceptance/fixtures')

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
const terminalStates = new Set(['success', 'empty', 'error'])
const dictIds = new Set([
  'ahdict',
  'baidu',
  'bing',
  'caiyun',
  'cambridge',
  'cnki',
  'cobuild',
  'etymonline',
  'eudic',
  'google',
  'googledict',
  'guoyu',
  'hjdict',
  'jikipedia',
  'jukuu',
  'lexico',
  'liangan',
  'longman',
  'macmillan',
  'merriamwebster',
  'mojidict',
  'naver',
  'oaldict',
  'renren',
  'shanbay',
  'sogou',
  'tencent',
  'urban',
  'vocabulary',
  'weblio',
  'weblioejje',
  'websterlearner',
  'wikipedia',
  'youdao',
  'youdaotrans',
  'zdic'
])
const stepActions = new Set([
  'lookup',
  'search',
  'addToNotebook',
  'historyBack',
  'historyForward',
  'closePanel',
  'openQuickSearch',
  'openPdf',
  'triggerContextMenuAction',
  'triggerCommand',
  'openExtensionPage',
  'openOptionsEntry',
  'playAudio',
  'clipboardRoundtrip',
  'closeQuickSearch'
])
const scenarioRunners = new Set(['acceptance', 'e2e'])
const pdfTriggers = new Set(['currentPage', 'link', 'sniff'])
const supportedCommands = new Set([
  'open-quick-search',
  'search-clipboard',
  'next-profile',
  'prev-profile',
  'profile-1',
  'profile-2',
  'profile-3',
  'profile-4',
  'profile-5',
  'open-google',
  'open-youdao',
  'open-caiyun'
])
const lookupContextMenuItems = new Set(['saladict', 'saladict_standalone'])
const pageTranslateMenuItems = new Set([
  'google_page_translate',
  'google_cn_page_translate',
  'youdao_page_translate',
  'caiyuntrs',
  'baidu_page_translate',
  'sogou_page_translate',
  'microsoft_page_translate'
])
const supportedContextMenuItems = new Set([
  ...lookupContextMenuItems,
  ...pageTranslateMenuItems
])
const extensionPages = new Set([
  'popup.html',
  'options.html',
  'history.html',
  'notebook.html',
  'word-editor.html',
  'audio-control.html'
])
const playbackStates = new Set(['started'])
const pageTranslateProviders = new Set([
  'google',
  'youdao',
  'caiyun',
  'baidu',
  'sogou',
  'microsoft'
])
const optionEntries = new Set([
  'General',
  'Privacy',
  'Dictionaries',
  'QuickSearch',
  'Popup',
  'ContextMenus',
  'SearchModes',
  'Permissions',
  'DictAuths',
  'Profiles',
  'Notebook',
  'DictPanel',
  'BlackWhiteList',
  'ImportExport',
  'PDF'
])
const optionControlGroups = new Set(['syncServices'])

if (!Array.isArray(spec) || spec.length === 0) {
  throw new Error('test/acceptance/spec.json must be a non-empty array')
}

const ids = new Set()
for (const scenario of spec) {
  for (const field of ['id', 'intent']) {
    if (!scenario[field] || typeof scenario[field] !== 'string') {
      throw new Error(`Acceptance scenario is missing "${field}": ${JSON.stringify(scenario)}`)
    }
  }

  if (scenario.feature != null && typeof scenario.feature !== 'string') {
    throw new Error(`Scenario "${scenario.id}" has invalid "feature"`)
  }

  if (scenario.runner != null && !scenarioRunners.has(scenario.runner)) {
    throw new Error(
      `Scenario "${scenario.id}" has invalid runner="${scenario.runner}"`
    )
  }

  if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
    throw new Error(`Acceptance scenario "${scenario.id}" must have a non-empty "steps" array`)
  }

  if (ids.has(scenario.id)) {
    throw new Error(`Duplicate acceptance scenario id: ${scenario.id}`)
  }
  ids.add(scenario.id)

  if (scenario.runtime != null) {
    if (typeof scenario.runtime !== 'object' || Array.isArray(scenario.runtime)) {
      throw new Error(`Scenario "${scenario.id}" has invalid "runtime"`)
    }
    if (scenario.runtime.selectedDicts != null) {
      if (
        !Array.isArray(scenario.runtime.selectedDicts) ||
        scenario.runtime.selectedDicts.length === 0 ||
        scenario.runtime.selectedDicts.some(id => typeof id !== 'string')
      ) {
        throw new Error(
          `Scenario "${scenario.id}" runtime.selectedDicts must be a non-empty string array`
        )
      }
      scenario.runtime.selectedDicts.forEach(id => {
        if (!dictIds.has(id)) {
          throw new Error(`Scenario "${scenario.id}" has unknown runtime dict id "${id}"`)
        }
      })
    }
  }

  scenario.steps.forEach((step, index) => {
    if (!step.action || typeof step.action !== 'string') {
      throw new Error(`Scenario "${scenario.id}" step #${index + 1} is missing "action"`)
    }
    if (!stepActions.has(step.action)) {
      throw new Error(
        `Scenario "${scenario.id}" step #${index + 1} has unsupported action "${step.action}"`
      )
    }

    if (step.action === 'lookup') {
      const hasWordLookup = typeof step.word === 'string'
      const hasRangeLookup =
        typeof step.rangeStartWord === 'string' &&
        typeof step.rangeEndWord === 'string'

      if (!hasWordLookup && !hasRangeLookup) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare either "word" or a range lookup`
        )
      }

      if (hasRangeLookup && (!step.expectedSelection || typeof step.expectedSelection !== 'string')) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare "expectedSelection" for range lookup`
        )
      }

      if (
        step.rangeEndFrom != null &&
        step.rangeEndFrom !== 'left' &&
        step.rangeEndFrom !== 'right'
      ) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid rangeEndFrom="${step.rangeEndFrom}"`
        )
      }

      for (const field of ['targetId', 'expectedPanelState', 'expectedItemState']) {
        if (!step[field] || typeof step[field] !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} is missing "${field}"`
          )
        }
      }
    }

    if (step.action === 'search') {
      for (const field of ['query', 'expectedPanelState', 'expectedItemState']) {
        if (!step[field] || typeof step[field] !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} is missing "${field}"`
          )
        }
      }
    }

    if (step.action === 'closePanel') {
      if (step.expectedPanelVisible !== false || step.expectedBowlVisible !== false) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must explicitly expect panel and bowl to be hidden`
        )
      }
    }

    if (step.action === 'openQuickSearch') {
      if (!step.expectedPage || typeof step.expectedPage !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare "expectedPage"`
        )
      }

      if (
        step.expectedWindowCount == null ||
        typeof step.expectedWindowCount !== 'number' ||
        step.expectedWindowCount <= 0
      ) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare positive numeric "expectedWindowCount"`
        )
      }

      if (step.expectedReuse != null && typeof step.expectedReuse !== 'boolean') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid expectedReuse="${step.expectedReuse}"`
        )
      }

      const hasWordLookup = typeof step.word === 'string'
      const hasRangeLookup =
        typeof step.rangeStartWord === 'string' &&
        typeof step.rangeEndWord === 'string'

      if (hasWordLookup || hasRangeLookup) {
        if (!step.targetId || typeof step.targetId !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare "targetId" for Quick Search preload`
          )
        }
      }

      if (hasRangeLookup && (!step.expectedSelection || typeof step.expectedSelection !== 'string')) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare "expectedSelection" for Quick Search range preload`
        )
      }
    }

    if (step.action === 'openPdf') {
      if (!step.trigger || !pdfTriggers.has(step.trigger)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare valid PDF trigger`
        )
      }

      for (const field of ['sourceUrl', 'expectedPage', 'expectedFileUrl']) {
        if (!step[field] || typeof step[field] !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} is missing "${field}"`
          )
        }
      }
    }

    if (step.action === 'triggerContextMenuAction') {
      if (!step.menuItemId || !supportedContextMenuItems.has(step.menuItemId)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare valid menuItemId`
        )
      }
      if (lookupContextMenuItems.has(step.menuItemId)) {
        if (!step.targetId || typeof step.targetId !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare "targetId"`
          )
        }
        if (!step.expectedPanelState || !terminalStates.has(step.expectedPanelState)) {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare valid expectedPanelState`
          )
        }
        if (!step.expectedItemState || !terminalStates.has(step.expectedItemState)) {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare valid expectedItemState`
          )
        }
      }
      if (pageTranslateMenuItems.has(step.menuItemId)) {
        if (
          !step.expectedPageTranslateProvider ||
          !pageTranslateProviders.has(step.expectedPageTranslateProvider)
        ) {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare valid expectedPageTranslateProvider`
          )
        }
      }
    }

    if (step.action === 'triggerCommand') {
      if (!step.command || !supportedCommands.has(step.command)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare valid command`
        )
      }
      if (step.clipboardText != null && typeof step.clipboardText !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid clipboardText`
        )
      }
      if (step.expectedPage != null && typeof step.expectedPage !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid expectedPage`
        )
      }
      if (
        ['next-profile', 'prev-profile', 'profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5'].includes(
          step.command
        )
      ) {
        if (typeof step.expectedProfileChanged !== 'boolean') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare boolean expectedProfileChanged`
          )
        }
      }
      if (['open-google', 'open-youdao', 'open-caiyun'].includes(step.command)) {
        if (
          !step.expectedPageTranslateProvider ||
          !pageTranslateProviders.has(step.expectedPageTranslateProvider)
        ) {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} must declare valid expectedPageTranslateProvider`
          )
        }
      }
    }

    if (step.action === 'openExtensionPage') {
      if (!step.page || !extensionPages.has(step.page)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare supported extension page`
        )
      }
      if (!step.expectedPage || typeof step.expectedPage !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare expectedPage`
        )
      }
      if (typeof step.expectedRendered !== 'boolean') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare boolean expectedRendered`
        )
      }
    }

    if (step.action === 'openOptionsEntry') {
      if (!step.entry || !optionEntries.has(step.entry)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare supported option entry`
        )
      }
      if (!step.expectedEntry || typeof step.expectedEntry !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare expectedEntry`
        )
      }
      if (typeof step.expectedRendered !== 'boolean') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare boolean expectedRendered`
        )
      }
      if (
        step.expectedControlGroup != null &&
        !optionControlGroups.has(step.expectedControlGroup)
      ) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid expectedControlGroup`
        )
      }
    }

    if (step.action === 'playAudio') {
      if (!step.audioSource || typeof step.audioSource !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare audioSource`
        )
      }
      if (!step.expectedPlayback || !playbackStates.has(step.expectedPlayback)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare valid expectedPlayback`
        )
      }
    }

    if (step.action === 'clipboardRoundtrip') {
      for (const field of ['inputText', 'expectedClipboardText']) {
        if (!step[field] || typeof step[field] !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} is missing "${field}"`
          )
        }
      }
    }

    if (step.action === 'addToNotebook') {
      if (step.expectedFavActive !== true) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must explicitly expect favorite state to become active`
        )
      }
      if (!step.expectedSavedText || typeof step.expectedSavedText !== 'string') {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} must declare "expectedSavedText"`
        )
      }
    }

    if (step.action === 'historyBack' || step.action === 'historyForward') {
      for (const field of ['query', 'expectedPanelState', 'expectedItemState']) {
        if (!step[field] || typeof step[field] !== 'string') {
          throw new Error(
            `Scenario "${scenario.id}" step #${index + 1} is missing "${field}"`
          )
        }
      }
    }

    for (const stateField of ['expectedPanelState', 'expectedItemState']) {
      if (step[stateField] != null && !terminalStates.has(step[stateField])) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid ${stateField}="${step[stateField]}"`
        )
      }
    }

    if (step.expectedDictId != null) {
      if (typeof step.expectedDictId !== 'string' || !dictIds.has(step.expectedDictId)) {
        throw new Error(
          `Scenario "${scenario.id}" step #${index + 1} has invalid expectedDictId="${step.expectedDictId}"`
        )
      }
    }

    if (step.bingFixture != null) {
      const fixturePath = path.join(fixtureDir, step.bingFixture)
      if (!fs.existsSync(fixturePath)) {
        throw new Error(`Missing acceptance fixture: ${fixturePath}`)
      }
    }

    if (step.googleFixture != null) {
      const fixturePath = path.join(fixtureDir, step.googleFixture)
      if (!fs.existsSync(fixturePath)) {
        throw new Error(`Missing acceptance fixture: ${fixturePath}`)
      }
    }
  })
}

console.log(`Validated ${spec.length} acceptance scenarios.`)
