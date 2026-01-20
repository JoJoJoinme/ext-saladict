const fs = require('fs-extra')
const path = require('path')

async function main() {
  const buildDir = path.join(__dirname, '../build/chrome')
  const manifestPath = path.join(buildDir, 'manifest.json')

  if (!await fs.pathExists(manifestPath)) {
      console.log('Manifest not found at', manifestPath)
      return
  }

  const manifest = await fs.readJson(manifestPath)

  // Fix background
  if (manifest.background && manifest.background.scripts) {
    const scripts = manifest.background.scripts
    const backgroundWrapper = scripts.map(s => `importScripts('${s}');`).join('\n')
    await fs.writeFile(path.join(buildDir, 'background.js'), backgroundWrapper)

    manifest.background = {
      service_worker: 'background.js'
    }
  }

  // Fix action (remove browser_action if present, action should be already there or we need to map it)
  // We added "action" in chrome.manifest.json, so it should be present.
  if (manifest.browser_action) {
    // Check if we need to copy properties to action if action is missing?
    // But we added action manually.
    delete manifest.browser_action
  }

  await fs.writeJson(manifestPath, manifest, { spaces: 2 })
  console.log('MV3 fix applied to', manifestPath)
}

main().catch(console.error)
