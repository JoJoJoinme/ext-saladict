import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const gatesDir = path.join(ROOT, 'docs', 'gates')
const specPath = path.join(ROOT, 'test', 'acceptance', 'spec.json')

function fail(message) {
  console.error(`BDD gate failed: ${message}`)
  process.exit(1)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function assertFileExists(relPath, context) {
  const abs = path.join(ROOT, relPath)
  if (!fs.existsSync(abs)) {
    fail(`${context}: missing file ${relPath}`)
  }
}

if (!fs.existsSync(gatesDir)) {
  fail('missing docs/gates directory')
}

const gateFiles = fs
  .readdirSync(gatesDir)
  .filter(name => name.endsWith('.json'))
  .sort()

if (gateFiles.length === 0) {
  fail('no gate files found in docs/gates')
}

assertFileExists('test/acceptance/spec.json', 'spec carrier root')
const spec = readJson(specPath)
const scenarioIds = new Set(spec.map(item => item.id))

const validTaskTypes = new Set(['migration', 'compatibility', 'behavior_alignment'])
const validStatuses = new Set(['bdd_covered', 'bdd_gap', 'exploratory_spike'])
const validFeatureStatuses = new Set(['bdd_covered', 'bdd_gap', 'exploratory_spike'])

const summaries = []

for (const fileName of gateFiles) {
  const rel = path.join('docs', 'gates', fileName)
  const gate = readJson(path.join(gatesDir, fileName))

  if (!gate.task_id || typeof gate.task_id !== 'string') {
    fail(`${rel}: missing string task_id`)
  }
  if (!gate.task_type || typeof gate.task_type !== 'string') {
    fail(`${rel}: missing string task_type`)
  }
  if (!gate.spec_carrier || typeof gate.spec_carrier !== 'string') {
    fail(`${rel}: missing string spec_carrier`)
  }
  if (typeof gate.user_visible_changes !== 'boolean') {
    fail(`${rel}: user_visible_changes must be boolean`)
  }
  if (!validStatuses.has(gate.bdd_status)) {
    fail(
      `${rel}: invalid bdd_status "${gate.bdd_status}", expected one of ${[
        ...validStatuses
      ].join(', ')}`
    )
  }
  if (typeof gate.implementation_allowed !== 'boolean') {
    fail(`${rel}: implementation_allowed must be boolean`)
  }

  assertFileExists(gate.spec_carrier, `${rel} spec_carrier`)

  if (gate.user_visible_changes && gate.spec_carrier !== 'test/acceptance/spec.json') {
    fail(
      `${rel}: user_visible_changes=true requires spec_carrier to be test/acceptance/spec.json`
    )
  }

  if (validTaskTypes.has(gate.task_type)) {
    const explicit = gate.baseline_inputs?.explicit_product_baseline
    const legacy = gate.baseline_inputs?.legacy_implementation_baseline

    if (!Array.isArray(explicit) || explicit.length === 0) {
      fail(`${rel}: explicit_product_baseline must be a non-empty array`)
    }
    if (!Array.isArray(legacy) || legacy.length === 0) {
      fail(`${rel}: legacy_implementation_baseline must be a non-empty array`)
    }

    explicit.forEach(p => assertFileExists(p, `${rel} explicit_product_baseline`))
    legacy.forEach(p => assertFileExists(p, `${rel} legacy_implementation_baseline`))
  }

  if (!Array.isArray(gate.covered_scenarios)) {
    fail(`${rel}: covered_scenarios must be an array`)
  }

  for (const scenarioId of gate.covered_scenarios) {
    if (!scenarioIds.has(scenarioId)) {
      fail(`${rel}: covered scenario "${scenarioId}" does not exist in spec.json`)
    }
  }

  if (gate.bdd_status === 'bdd_covered') {
    if (!gate.implementation_allowed) {
      fail(`${rel}: bdd_covered requires implementation_allowed=true`)
    }
    if (gate.covered_scenarios.length === 0) {
      fail(`${rel}: bdd_covered requires at least one covered scenario`)
    }
  }

  if (gate.bdd_status === 'bdd_gap') {
    if (gate.implementation_allowed) {
      fail(`${rel}: bdd_gap requires implementation_allowed=false`)
    }
    if (!Array.isArray(gate.pending_features) || gate.pending_features.length === 0) {
      fail(`${rel}: bdd_gap requires non-empty pending_features`)
    }
  }

  if (gate.bdd_status === 'exploratory_spike' && gate.implementation_allowed) {
    fail(`${rel}: exploratory_spike requires implementation_allowed=false`)
  }

  if (Array.isArray(gate.pending_features)) {
    for (const feature of gate.pending_features) {
      if (!feature.id || !feature.name) {
        fail(`${rel}: each pending feature must include id and name`)
      }
      if (typeof feature.user_visible !== 'boolean') {
        fail(`${rel}: pending feature ${feature.id} must include boolean user_visible`)
      }
      if (!validFeatureStatuses.has(feature.status)) {
        fail(
          `${rel}: pending feature ${feature.id} has invalid status "${feature.status}"`
        )
      }
      if (!Array.isArray(feature.scenario_ids)) {
        fail(`${rel}: pending feature ${feature.id} must include scenario_ids array`)
      }
      for (const scenarioId of feature.scenario_ids) {
        if (!scenarioIds.has(scenarioId)) {
          fail(
            `${rel}: pending feature ${feature.id} references missing scenario "${scenarioId}"`
          )
        }
      }
      if (feature.user_visible && feature.status === 'bdd_covered' && feature.scenario_ids.length === 0) {
        fail(
          `${rel}: user-visible pending feature ${feature.id} marked bdd_covered must include scenario_ids`
        )
      }
      if (feature.user_visible && feature.status === 'bdd_gap' && !feature.baseline_doc) {
        fail(
          `${rel}: user-visible pending feature ${feature.id} marked bdd_gap must include baseline_doc`
        )
      }
      for (const key of ['baseline_doc', 'proposal_doc', 'test_doc']) {
        if (feature[key]) {
          assertFileExists(feature[key], `${rel} pending_feature.${feature.id}.${key}`)
        }
      }
    }
  }

  const featureCount = Array.isArray(gate.pending_features)
    ? gate.pending_features.length
    : 0
  const featureGapCount = Array.isArray(gate.pending_features)
    ? gate.pending_features.filter(feature => feature.status === 'bdd_gap').length
    : 0

  summaries.push(
    `${gate.task_id}: ${gate.bdd_status}, implementation_allowed=${gate.implementation_allowed}, covered_scenarios=${gate.covered_scenarios.length}, tracked_features=${featureCount}, feature_gaps=${featureGapCount}`
  )
}

console.log('BDD gate passed')
summaries.forEach(line => console.log(`- ${line}`))
