import fs from 'fs'
import path from 'path'
import {
  phasePrompts,
  phaseArtifacts,
  phaseKeywordExpectations,
  phaseContinuationMode
} from './lib/phase-workflow.mjs'

const ROOT = process.cwd()

const requiredFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  'Project.md',
  '.github/copilot-instructions.md',
  '.github/KnowledgeBase/Index.md',
  '.github/prompts/kb-sync.prompt.md',
  '.github/TaskLogs/Copilot_Scrum.md',
  '.github/TaskLogs/Copilot_Task.md',
  '.github/TaskLogs/Copilot_Planning.md',
  '.github/TaskLogs/Copilot_Execution.md',
  '.github/TaskLogs/Copilot_KB.md',
  '.github/TaskLogs/Copilot_Investigate.md',
  '.github/TaskLogs/Copilot_Review.md'
]

const taskLogHeaders = new Map([
  ['.github/TaskLogs/Copilot_Scrum.md', '# !!!SCRUM!!!'],
  ['.github/TaskLogs/Copilot_Task.md', '# !!!TASK!!!'],
  ['.github/TaskLogs/Copilot_Planning.md', '# !!!PLANNING!!!'],
  ['.github/TaskLogs/Copilot_Execution.md', '# !!!EXECUTION!!!'],
  ['.github/TaskLogs/Copilot_KB.md', '# !!!KB!!!'],
  ['.github/TaskLogs/Copilot_Investigate.md', '# !!!INVESTIGATE!!!'],
  ['.github/TaskLogs/Copilot_Review.md', '# !!!REVIEW!!!']
])

function fail(message) {
  console.error(`Phase protocol check failed: ${message}`)
  process.exit(1)
}

function assertFileExists(relPath) {
  const absPath = path.join(ROOT, relPath)
  if (!fs.existsSync(absPath)) {
    fail(`missing file ${relPath}`)
  }
}

function readFile(relPath) {
  assertFileExists(relPath)
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8')
}

function assertIncludes(relPath, needle, context) {
  const text = readFile(relPath)
  if (!text.includes(needle)) {
    fail(`${relPath}: missing ${context} -> ${needle}`)
  }
}

for (const relPath of requiredFiles) {
  assertFileExists(relPath)
}

for (const relPath of phasePrompts.values()) {
  assertFileExists(relPath)
}

for (const [relPath, header] of taskLogHeaders) {
  const text = readFile(relPath)
  const firstLine = text.split('\n', 1)[0].trim()
  if (firstLine !== header) {
    fail(`${relPath}: expected first line "${header}", got "${firstLine}"`)
  }
}

for (const [phase, promptPath] of phasePrompts) {
  assertIncludes('AGENTS.md', `\`${phase}\``, `phase keyword`)
  assertIncludes('AGENTS.md', promptPath, `prompt path for ${phase}`)
  assertIncludes('CLAUDE.md', `\`${phase}\``, `phase keyword`)
  assertIncludes('CLAUDE.md', promptPath, `prompt path for ${phase}`)
  assertIncludes(
    '.github/copilot-instructions.md',
    promptPath.startsWith('.github/')
      ? `REPO-ROOT/${promptPath}`
      : promptPath,
    `prompt path for ${phase}`
  )
}

for (const [phase, artifactPath] of phaseArtifacts) {
  assertFileExists(artifactPath)
  assertIncludes(
    phasePrompts.get(phase),
    path.basename(artifactPath),
    `artifact reference for ${phase}`
  )
}

for (const relPath of taskLogHeaders.keys()) {
  const fileName = path.basename(relPath)
  assertIncludes('Project.md', relPath, `task-log path ${fileName}`)
  assertIncludes(
    '.github/KnowledgeBase/Index.md',
    `REPO-ROOT/${relPath}`,
    `knowledge-base entry for ${fileName}`
  )
}

assertIncludes(
  'Project.md',
  'REPO-ROOT/.github/KnowledgeBase/Index.md',
  'knowledge-base entrypoint'
)
assertIncludes(
  '.github/copilot-instructions.md',
  'REPO-ROOT/.github/KnowledgeBase/Index.md',
  'knowledge-base entrypoint'
)

assertIncludes(
  '.github/prompts/0-scrum.prompt.md',
  'Copilot_Scrum.md',
  'scrum artifact reference'
)
assertIncludes(
  '.github/prompts/1-design.prompt.md',
  'Copilot_Task.md',
  'design artifact reference'
)
assertIncludes(
  '.github/prompts/2-planning.prompt.md',
  'Copilot_Planning.md',
  'planning artifact reference'
)
assertIncludes(
  '.github/prompts/3-summarizing.prompt.md',
  'Copilot_Execution.md',
  'summarize artifact reference'
)
assertIncludes(
  '.github/prompts/4-execution.prompt.md',
  'Copilot_Execution.md',
  'execution artifact reference'
)
assertIncludes(
  '.github/prompts/5-verifying.prompt.md',
  'Copilot_Execution.md',
  'verify artifact reference'
)
assertIncludes(
  '.github/prompts/investigate.prompt.md',
  'Copilot_Investigate.md',
  'investigate artifact reference'
)
assertIncludes(
  '.github/prompts/kb.prompt.md',
  'Copilot_KB.md',
  'kb artifact reference'
)
assertIncludes(
  '.github/prompts/review.prompt.md',
  'Copilot_Review.md',
  'review artifact reference'
)

for (const [phase, expectedMode] of phaseContinuationMode) {
  const promptPath = phasePrompts.get(phase)
  if (!promptPath) continue
  const promptText = readFile(promptPath)
  if (expectedMode === 'implicit_continue' && !/continue/i.test(promptText)) {
    fail(`${promptPath}: expected continuation semantics for phase "${phase}"`)
  }
}

for (const [phase, keywords] of phaseKeywordExpectations) {
  const promptPath = phasePrompts.get(phase)
  if (!promptPath) continue
  for (const keyword of keywords) {
    assertIncludes(promptPath, keyword, `request keyword for ${phase}`)
  }
}

console.log('Phase protocol check passed')
console.log(`- prompts: ${phasePrompts.size}`)
console.log(`- task logs: ${taskLogHeaders.size}`)
console.log(`- required files: ${requiredFiles.length}`)
