export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  matchAboutBlank: true,
  async main() {
    await import('@/selection/index')
  }
})
