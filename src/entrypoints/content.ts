export default defineContentScript({
  matches: ['<all_urls>'],
  css: ['assets/content.css'],
  async main() {
    await import('@/content/index')
  }
})
