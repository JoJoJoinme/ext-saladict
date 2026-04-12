import React, { ComponentType, FC, useMemo, Suspense } from 'react'
import classNames from 'classnames'
import root from 'react-shadow'
import { Observable } from 'rxjs'
import { DictID } from '@/app-config'
import { Word } from '@/_helpers/record-manager'
import { SALADICT_PANEL } from '@/_helpers/saladict'
import { useTranslate } from '@/_helpers/i18n'
import { ViewPorps } from '@/components/dictionaries/helpers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { StaticSpeakerContainer } from '@/components/Speaker'
import { LookupErrorType } from '@/components/dictionaries/helpers'
import {
  getLookupDictState,
  hasRenderableLookupResult
} from '@/content/acceptance/lookup-contract'
import dictContentStyles from './DictItemContent.shadow.scss?inline'

export interface DictItemBodyProps {
  dictID: DictID

  darkMode: boolean
  withAnimation: boolean

  panelCSS: string

  searchStatus: 'IDLE' | 'SEARCHING' | 'FINISH'
  searchResult?: object | null
  searchError?: LookupErrorType | null

  catalogSelect$: Observable<{ key: string; value: string }>

  dictRootRef: React.MutableRefObject<HTMLDivElement | null>

  searchText: (arg?: {
    id?: DictID
    word?: Word
    payload?: { [index: string]: any }
  }) => any

  onSpeakerPlay: (src: string) => Promise<void>

  onInPanelSelect: (e: React.MouseEvent<HTMLElement>) => void
}

export const DictItemBody: FC<DictItemBodyProps> = props => {
  const { t } = useTranslate('content')
  const lookupState = getLookupDictState(props)
  const Dict = useMemo(
    () =>
      React.lazy<ComponentType<ViewPorps<any>>>(() =>
        import(
          /* webpackInclude: /View\.tsx$/ */
          /* webpackMode: "lazy" */
          `@/components/dictionaries/${props.dictID}/View.tsx`
        )
      ),
    [props.dictID]
  )

  const DictStyle = useMemo(
    () =>
      React.lazy(async () => {
        const styleModule = await import(
          /* webpackInclude: /_style\.shadow\.scss$/ */
          /* webpackMode: "lazy" */
          `@/components/dictionaries/${props.dictID}/_style.shadow.scss?inline`
        )
        const styleText =
          typeof styleModule.default === 'string'
            ? styleModule.default
            : String(styleModule.default || '')

        return {
          default: () => <style>{styleText}</style>
        }
      }),
    [props.dictID]
  )

  return (
    <ErrorBoundary error={DictRenderError}>
      <Suspense fallback={null}>
        {props.searchStatus === 'FINISH' &&
          (lookupState === 'success' &&
          hasRenderableLookupResult(props.searchResult) ? (
          <root.div>
            <div
              ref={props.dictRootRef}
              data-testid="lookup-dict-result"
              data-lookup-state="success"
              className={classNames({ darkMode: props.darkMode })}
            >
              <style>{dictContentStyles}</style>
              <DictStyle />
              {props.panelCSS ? <style>{props.panelCSS}</style> : null}
              <StaticSpeakerContainer
                className={classNames(
                  `d-${props.dictID}`,
                  'dictRoot',
                  SALADICT_PANEL,
                  { isAnimate: props.withAnimation }
                )}
                onPlayStart={props.onSpeakerPlay}
                onMouseUp={props.onInPanelSelect}
              >
                <Dict
                  result={props.searchResult}
                  searchText={props.searchText}
                  catalogSelect$={props.catalogSelect$}
                />
              </StaticSpeakerContainer>
            </div>
          </root.div>
          ) : lookupState === 'error' ? (
            <p
              className="dictItem-ErrorState"
              data-testid="lookup-dict-error"
              data-lookup-state="error"
            >
              {t('lookupError')}
            </p>
          ) : (
            <p
              className="dictItem-EmptyState"
              data-testid="lookup-dict-empty"
              data-lookup-state="empty"
            >
              {t('noResult')}
            </p>
          ))}
      </Suspense>
    </ErrorBoundary>
  )
}

function DictRenderError() {
  const { t } = useTranslate('content')
  return (
    <p
      className="dictItem-ErrorState"
      data-testid="lookup-dict-error"
      data-lookup-state="error"
      style={{ textAlign: 'center' }}
    >
      {t('renderError')}{' '}
      <a
        href="https://github.com/crimx/ext-saladict/issues"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        report issue
      </a>
      .
    </p>
  )
}
