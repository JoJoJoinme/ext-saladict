/**
 * MV3: Uses chrome.scripting API instead of browser.tabs.executeScript/insertCSS
 */
export async function injectDictPanel(tab: browser.tabs.Tab | undefined) {
  if (tab && tab.id) {
    const tabId = tab.id
    const manifest = browser.runtime.getManifest()
    if (manifest.content_scripts) {
      for (const script of manifest.content_scripts) {
        if (script.js) {
          for (const js of script.js) {
            await chrome.scripting.executeScript({
              target: {
                tabId,
                allFrames: script.all_frames || false
              },
              files: [js[0] === '/' ? js : `/${js}`]
            })
          }
        }
        if (script.css) {
          for (const css of script.css) {
            await chrome.scripting.insertCSS({
              target: {
                tabId,
                allFrames: script.all_frames || false
              },
              files: [css[0] === '/' ? css : `/${css}`]
            })
          }
        }
      }
    }
  }
}
