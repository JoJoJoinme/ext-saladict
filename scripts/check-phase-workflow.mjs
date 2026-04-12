import {
  dispatchPhaseRequest,
  phaseArtifacts,
  phaseContinuationMode
} from './lib/phase-workflow.mjs'

function fail(message) {
  console.error(`Phase workflow check failed: ${message}`)
  process.exit(1)
}

function expectWorkflow(input, expected) {
  const result = dispatchPhaseRequest(input)
  if (result.kind !== 'single') {
    fail(`expected single workflow dispatch for "${input}"`)
  }
  for (const [key, value] of Object.entries(expected)) {
    if (result[key] !== value) {
      fail(
        `"${input}" expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(result[key])}`
      )
    }
  }
}

function expectComposite(input, expectedPhases) {
  const result = dispatchPhaseRequest(input)
  if (result.kind !== 'composite') {
    fail(`expected composite workflow dispatch for "${input}"`)
  }
  if (JSON.stringify(result.phases) !== JSON.stringify(expectedPhases)) {
    fail(`"${input}" expected phases ${JSON.stringify(expectedPhases)}, got ${JSON.stringify(result.phases)}`)
  }
}

expectWorkflow('scrum problem protocol hardening', {
  phase: 'scrum',
  artifact: phaseArtifacts.get('scrum'),
  continuationMode: phaseContinuationMode.get('scrum'),
  transformed: '# Problem\nprotocol hardening'
})

expectWorkflow('scrum', {
  phase: 'scrum',
  artifact: phaseArtifacts.get('scrum'),
  continuationMode: phaseContinuationMode.get('scrum'),
  transformed: ''
})

expectWorkflow('design problem next', {
  phase: 'design',
  artifact: phaseArtifacts.get('design'),
  continuationMode: phaseContinuationMode.get('design'),
  transformed: '# Problem\nnext'
})

expectWorkflow('plan', {
  phase: 'plan',
  artifact: phaseArtifacts.get('plan'),
  continuationMode: phaseContinuationMode.get('plan'),
  transformed: ''
})

expectWorkflow('summarize', {
  phase: 'summarize',
  artifact: phaseArtifacts.get('summarize'),
  continuationMode: phaseContinuationMode.get('summarize'),
  transformed: ''
})

expectWorkflow('execute', {
  phase: 'execute',
  artifact: phaseArtifacts.get('execute'),
  continuationMode: phaseContinuationMode.get('execute'),
  transformed: ''
})

expectWorkflow('verify runtime gate', {
  phase: 'verify',
  artifact: phaseArtifacts.get('verify'),
  continuationMode: phaseContinuationMode.get('verify'),
  transformed: 'runtime gate'
})

expectWorkflow('investigate', {
  phase: 'investigate',
  artifact: phaseArtifacts.get('investigate'),
  continuationMode: phaseContinuationMode.get('investigate'),
  transformed: ''
})

expectWorkflow('investigate report popup blocked', {
  phase: 'investigate',
  artifact: phaseArtifacts.get('investigate'),
  continuationMode: phaseContinuationMode.get('investigate'),
  transformed: '# Report\npopup blocked'
})

expectWorkflow('kb', {
  phase: 'kb',
  artifact: phaseArtifacts.get('kb'),
  continuationMode: phaseContinuationMode.get('kb'),
  transformed: ''
})

expectWorkflow('review', {
  phase: 'review',
  artifact: phaseArtifacts.get('review'),
  continuationMode: phaseContinuationMode.get('review'),
  transformed: ''
})

expectWorkflow('review report missing scenarios', {
  phase: 'review',
  artifact: phaseArtifacts.get('review'),
  continuationMode: phaseContinuationMode.get('review'),
  transformed: '# Report\nmissing scenarios'
})

expectWorkflow('refine workflow drift', {
  phase: 'refine',
  artifact: null,
  continuationMode: phaseContinuationMode.get('refine'),
  transformed: 'workflow drift'
})

expectWorkflow('code update protocol docs', {
  phase: 'code',
  artifact: null,
  continuationMode: phaseContinuationMode.get('code'),
  transformed: 'update protocol docs'
})

expectWorkflow('plain natural language request', {
  phase: 'code',
  artifact: null,
  continuationMode: phaseContinuationMode.get('code'),
  transformed: 'plain natural language request'
})

expectComposite('execute and verify', ['execute', 'verify'])

console.log('Phase workflow check passed')
console.log('- verified phase -> artifact routing')
console.log('- verified continuation-mode semantics')
console.log('- verified composite execute-and-verify dispatch')
