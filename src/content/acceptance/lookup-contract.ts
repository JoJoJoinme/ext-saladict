import { LookupErrorType } from '@/components/dictionaries/helpers'

export type LookupRequestStatus = 'IDLE' | 'SEARCHING' | 'FINISH'

export type LookupDictState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'

export type LookupPanelState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface LookupDictSnapshot {
  searchStatus: LookupRequestStatus
  searchResult?: any | null
  searchError?: LookupErrorType | null
}

export interface LookupPanelSummary {
  state: LookupPanelState
  terminal: boolean
  counts: Record<LookupDictState, number>
}

export function hasRenderableLookupResult(result: any): boolean {
  if (!result) {
    return false
  }

  if (
    typeof result === 'object' &&
    'requireCredential' in result &&
    result.requireCredential
  ) {
    return true
  }

  if (
    typeof result === 'object' &&
    'searchText' in result &&
    'trans' in result &&
    Array.isArray(result.searchText?.paragraphs) &&
    Array.isArray(result.trans?.paragraphs)
  ) {
    return (
      result.searchText.paragraphs.join('').trim().length > 0 ||
      result.trans.paragraphs.join('').trim().length > 0
    )
  }

  return true
}

export function getLookupDictState({
  searchStatus,
  searchResult,
  searchError
}: LookupDictSnapshot): LookupDictState {
  if (searchStatus === 'SEARCHING') {
    return 'loading'
  }

  if (searchStatus !== 'FINISH') {
    return 'idle'
  }

  if (searchError && searchError !== 'NO_RESULT') {
    return 'error'
  }

  if (hasRenderableLookupResult(searchResult)) {
    return 'success'
  }

  return 'empty'
}

export function summarizeLookupPanel(
  dicts: LookupDictSnapshot[]
): LookupPanelSummary {
  const counts: Record<LookupDictState, number> = {
    idle: 0,
    loading: 0,
    success: 0,
    empty: 0,
    error: 0
  }

  for (const dict of dicts) {
    counts[getLookupDictState(dict)] += 1
  }

  let state: LookupPanelState = 'idle'
  if (counts.loading > 0) {
    state = 'loading'
  } else if (counts.success > 0) {
    state = 'success'
  } else if (counts.error > 0) {
    state = 'error'
  } else if (counts.empty > 0) {
    state = 'empty'
  }

  return {
    state,
    terminal: counts.loading === 0,
    counts
  }
}
