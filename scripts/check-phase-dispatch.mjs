import {
  phasePrompts,
  dispatchPhaseRequest
} from './lib/phase-workflow.mjs'

function fail(message) {
  console.error(`Phase dispatch check failed: ${message}`)
  process.exit(1)
}

function expectSingle(input, expectedPhase, expectedPrompt, expectedTransformed) {
  const result = dispatchPhaseRequest(input)
  if (result.kind !== 'single') {
    fail(`expected single dispatch for "${input}"`)
  }
  if (result.phase !== expectedPhase) {
    fail(`"${input}" dispatched to phase "${result.phase}" instead of "${expectedPhase}"`)
  }
  if (result.prompt !== expectedPrompt) {
    fail(`"${input}" dispatched to prompt "${result.prompt}" instead of "${expectedPrompt}"`)
  }
  if (result.transformed !== expectedTransformed) {
    fail(
      `"${input}" transformed to ${JSON.stringify(result.transformed)} instead of ${JSON.stringify(expectedTransformed)}`
    )
  }
}

function expectComposite(input, expectedPhases) {
  const result = dispatchPhaseRequest(input)
  if (result.kind !== 'composite') {
    fail(`expected composite dispatch for "${input}"`)
  }
  const actual = JSON.stringify(result.phases)
  const expected = JSON.stringify(expectedPhases)
  if (actual !== expected) {
    fail(`"${input}" dispatched to ${actual} instead of ${expected}`)
  }
}

expectSingle('scrum', 'scrum', '.github/prompts/0-scrum.prompt.md', '')
expectSingle('scrum learn', 'scrum', '.github/prompts/0-scrum.prompt.md', '# Learn')
expectSingle(
  'design problem next',
  'design',
  '.github/prompts/1-design.prompt.md',
  '# Problem\nnext'
)
expectSingle(
  'plan update add tests',
  'plan',
  '.github/prompts/2-planning.prompt.md',
  '# Update\nadd tests'
)
expectSingle(
  'summarize problem\nexecution handoff',
  'summarize',
  '.github/prompts/3-summarizing.prompt.md',
  '# Problem\nexecution handoff'
)
expectSingle(
  'verify quick-search regression',
  'verify',
  '.github/prompts/5-verifying.prompt.md',
  'quick-search regression'
)
expectSingle(
  'investigate repro popup blocked',
  'investigate',
  '.github/prompts/investigate.prompt.md',
  '# Repro\npopup blocked'
)
expectSingle(
  'review report missing gate',
  'review',
  '.github/prompts/review.prompt.md',
  '# Report\nmissing gate'
)
expectSingle(
  'kb sync protocol index',
  'kb',
  '.github/prompts/kb.prompt.md',
  '# Sync\nprotocol index'
)
expectSingle(
  'do this and do that',
  'code',
  '.github/prompts/code.prompt.md',
  'do this and do that'
)
expectComposite('execute and verify', ['execute', 'verify'])

console.log('Phase dispatch check passed')
console.log(`- tested cases: 10 single + 1 composite`)
