import {
  getLookupDictState,
  hasRenderableLookupResult,
  summarizeLookupPanel
} from '@/content/acceptance/lookup-contract'

describe('lookup acceptance contract', () => {
  test('treats searchable result as success', () => {
    expect(
      getLookupDictState({
        searchStatus: 'FINISH',
        searchResult: { result: { foo: 'bar' } }
      })
    ).toBe('success')
  })

  test('treats no-result as empty terminal state', () => {
    expect(
      getLookupDictState({
        searchStatus: 'FINISH',
        searchResult: null,
        searchError: 'NO_RESULT'
      })
    ).toBe('empty')
  })

  test('treats provider failure as error terminal state', () => {
    expect(
      getLookupDictState({
        searchStatus: 'FINISH',
        searchResult: null,
        searchError: 'NETWORK_ERROR'
      })
    ).toBe('error')
  })

  test('keeps loading non-terminal while searching', () => {
    expect(
      summarizeLookupPanel([
        {
          searchStatus: 'SEARCHING',
          searchResult: null
        }
      ])
    ).toEqual({
      state: 'loading',
      terminal: false,
      counts: {
        idle: 0,
        loading: 1,
        success: 0,
        empty: 0,
        error: 0
      }
    })
  })

  test('prioritizes success when at least one dict has usable content', () => {
    const summary = summarizeLookupPanel([
      {
        searchStatus: 'FINISH',
        searchResult: { result: { foo: 'bar' } }
      },
      {
        searchStatus: 'FINISH',
        searchResult: null,
        searchError: 'NETWORK_ERROR'
      }
    ])

    expect(summary.state).toBe('success')
    expect(summary.terminal).toBe(true)
    expect(summary.counts.success).toBe(1)
    expect(summary.counts.error).toBe(1)
  })

  test('machine translation payload with empty paragraphs is not renderable', () => {
    expect(
      hasRenderableLookupResult({
        searchText: { paragraphs: [''] },
        trans: { paragraphs: ['  '] }
      })
    ).toBe(false)
  })
})
