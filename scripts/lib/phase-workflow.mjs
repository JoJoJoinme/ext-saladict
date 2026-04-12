export const phasePrompts = new Map([
  ['scrum', '.github/prompts/0-scrum.prompt.md'],
  ['design', '.github/prompts/1-design.prompt.md'],
  ['plan', '.github/prompts/2-planning.prompt.md'],
  ['summarize', '.github/prompts/3-summarizing.prompt.md'],
  ['execute', '.github/prompts/4-execution.prompt.md'],
  ['verify', '.github/prompts/5-verifying.prompt.md'],
  ['ask', '.github/prompts/ask.prompt.md'],
  ['investigate', '.github/prompts/investigate.prompt.md'],
  ['code', '.github/prompts/code.prompt.md'],
  ['kb', '.github/prompts/kb.prompt.md'],
  ['refine', '.github/prompts/refine.prompt.md'],
  ['review', '.github/prompts/review.prompt.md']
])

export const phaseArtifacts = new Map([
  ['scrum', '.github/TaskLogs/Copilot_Scrum.md'],
  ['design', '.github/TaskLogs/Copilot_Task.md'],
  ['plan', '.github/TaskLogs/Copilot_Planning.md'],
  ['summarize', '.github/TaskLogs/Copilot_Execution.md'],
  ['execute', '.github/TaskLogs/Copilot_Execution.md'],
  ['verify', '.github/TaskLogs/Copilot_Execution.md'],
  ['investigate', '.github/TaskLogs/Copilot_Investigate.md'],
  ['kb', '.github/TaskLogs/Copilot_KB.md'],
  ['review', '.github/TaskLogs/Copilot_Review.md']
])

export const phaseSecondWordTitles = new Set([
  'scrum',
  'design',
  'plan',
  'summarize',
  'execute',
  'investigate',
  'review',
  'kb'
])

export const phaseContinuationMode = new Map([
  ['scrum', 'implicit_continue'],
  ['design', 'implicit_continue'],
  ['plan', 'implicit_continue'],
  ['summarize', 'implicit_continue'],
  ['execute', 'implicit_continue'],
  ['verify', 'artifact_continue'],
  ['ask', 'direct_answer'],
  ['investigate', 'implicit_continue'],
  ['code', 'direct_work'],
  ['kb', 'implicit_continue'],
  ['refine', 'direct_work'],
  ['review', 'implicit_continue']
])

export const phaseKeywordExpectations = new Map([
  ['scrum', ['# Problem', '# Update', '# Learn']],
  ['design', ['# Problem', '# Update']],
  ['plan', ['# Problem', '# Update']],
  ['summarize', ['# Problem']],
  ['execute', []],
  ['verify', []],
  ['ask', []],
  ['investigate', ['# Repro', '# Continue', '# Report']],
  ['code', []],
  ['kb', []],
  ['refine', []],
  ['review', []]
])

function toTitle(word) {
  if (!word) return ''
  return word[0].toUpperCase() + word.slice(1)
}

function extractFirstWord(input) {
  const match = input.match(/^\s*(\S+)([\s\S]*)$/)
  if (!match) {
    return null
  }
  return {
    word: match[1],
    rest: match[2] ?? ''
  }
}

function extractSecondWord(rest) {
  const match = rest.match(/^\s+(\S+)([\s\S]*)$/)
  if (!match) {
    return null
  }
  return {
    word: match[1],
    rest: match[2] ?? ''
  }
}

export function dispatchPhaseRequest(input) {
  if (input === 'execute and verify') {
    return {
      kind: 'composite',
      phases: ['execute', 'verify']
    }
  }

  const first = extractFirstWord(input)
  if (!first) {
    return {
      kind: 'single',
      phase: 'code',
      prompt: phasePrompts.get('code'),
      artifact: null,
      transformed: input,
      continuationMode: phaseContinuationMode.get('code')
    }
  }

  if (!phasePrompts.has(first.word)) {
    return {
      kind: 'single',
      phase: 'code',
      prompt: phasePrompts.get('code'),
      artifact: null,
      transformed: input,
      continuationMode: phaseContinuationMode.get('code')
    }
  }

  if (!phaseSecondWordTitles.has(first.word)) {
    return {
      kind: 'single',
      phase: first.word,
      prompt: phasePrompts.get(first.word),
      artifact: phaseArtifacts.get(first.word) ?? null,
      transformed: first.rest.trimStart(),
      continuationMode: phaseContinuationMode.get(first.word)
    }
  }

  const second = extractSecondWord(first.rest)
  if (!second) {
    return {
      kind: 'single',
      phase: first.word,
      prompt: phasePrompts.get(first.word),
      artifact: phaseArtifacts.get(first.word) ?? null,
      transformed: '',
      continuationMode: phaseContinuationMode.get(first.word)
    }
  }

  const suffix = second.rest.startsWith('\n') ? second.rest : `\n${second.rest.trimStart()}`
  return {
    kind: 'single',
    phase: first.word,
    prompt: phasePrompts.get(first.word),
    artifact: phaseArtifacts.get(first.word) ?? null,
    transformed: `# ${toTitle(second.word)}${second.rest ? suffix : ''}`,
    continuationMode: phaseContinuationMode.get(first.word)
  }
}
