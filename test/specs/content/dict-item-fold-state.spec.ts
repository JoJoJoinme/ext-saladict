import { getAutoFoldState } from '@/content/components/DictItem/fold-state'

describe('dict item fold state', () => {
  test('keeps empty terminal items collapsed by default', () => {
    expect(getAutoFoldState('FINISH', 'empty')).toBe('COLLAPSE')
  })

  test('shows successful terminal items in half mode by default', () => {
    expect(getAutoFoldState('FINISH', 'success')).toBe('HALF')
  })

  test('keeps loading and idle items collapsed', () => {
    expect(getAutoFoldState('SEARCHING', 'loading')).toBe('COLLAPSE')
    expect(getAutoFoldState('IDLE', 'idle')).toBe('COLLAPSE')
  })
})
