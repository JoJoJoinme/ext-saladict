export type DictItemFoldState = 'COLLAPSE' | 'HALF' | 'FULL'

export type DictItemLookupState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error'

export function getAutoFoldState(
  searchStatus: 'IDLE' | 'SEARCHING' | 'FINISH',
  lookupState: DictItemLookupState
): DictItemFoldState {
  if (searchStatus !== 'FINISH') {
    return 'COLLAPSE'
  }

  if (lookupState === 'empty') {
    return 'COLLAPSE'
  }

  return 'HALF'
}
