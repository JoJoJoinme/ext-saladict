import '@/background/index'

export default defineBackground({
  type: 'module',
  main() {
    // background/index already runs all initialization as side effects
  }
})
