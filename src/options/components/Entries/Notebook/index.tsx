import React, { FC, useState, ComponentType } from 'react'
import { Switch, Checkbox, Button } from 'antd'
import { concat, from } from 'rxjs'
import { pluck, map } from 'rxjs/operators'
import { useObservableState, useObservable, useRefFn } from 'observable-hooks'
import { objectKeys } from '@/typings/helpers'
import { useTranslate } from '@/_helpers/i18n'
import { storage } from '@/_helpers/browser-api'
import { useSelector } from '@/content/redux'
import { getConfigPath } from '@/options/helpers/path-joiner'
import {
  SaladictForm,
  SaladictFormItem
} from '@/options/components/SaladictForm'

const syncServiceModules = import.meta.glob<{ default: ComponentType<any> }>(
  './sync-services/*.tsx',
  { eager: true }
)
const syncServiceMap: Record<string, ComponentType<any>> = {}
const syncServiceIdList: string[] = []
for (const [path, mod] of Object.entries(syncServiceModules)) {
  const id = path.match(/sync-services\/([^/]+)\.tsx$/)?.[1]
  if (id) {
    syncServiceMap[id] = mod.default
    syncServiceIdList.push(id)
  }
}

export const Notebook: FC = () => {
  const { t } = useTranslate(['options', 'dicts', 'common', 'sync'])
  const ctxTrans = useSelector(state => state.config.ctxTrans)
  const syncServiceIds = useRefFn(() => syncServiceIdList).current
  const [showSyncServices, setShowSyncServices] = useState<{
    [id: string]: boolean
  }>({})
  const syncConfigs = useObservableState(
    useObservable(() =>
      concat(
        from(storage.sync.get('syncConfig')).pipe(pluck('syncConfig')),
        storage.sync.createStream('syncConfig').pipe(pluck('newValue'))
      ).pipe(
        map(syncConfig => {
          // legacy fix
          if (
            syncConfig?.webdav &&
            !Object.prototype.hasOwnProperty.call(syncConfig.webdav, 'enable')
          ) {
            syncConfig.webdav.enable = !!syncConfig.webdav.url
          }
          return syncConfig
        })
      )
    )
  )

  const formItems: SaladictFormItem[] = [
    {
      name: getConfigPath('editOnFav'),
      valuePropName: 'checked',
      children: <Switch />
    },
    {
      name: getConfigPath('searchHistory'),
      valuePropName: 'checked',
      children: <Switch />
    },
    {
      name: getConfigPath('searchHistoryInco'),
      hide: values => !values[getConfigPath('searchHistory')],
      valuePropName: 'checked',
      children: <Switch />
    },
    {
      key: getConfigPath('ctxTrans'),
      style: { marginBottom: 10 },
      items: objectKeys(ctxTrans).map(id => ({
        name: getConfigPath('ctxTrans', id),
        valuePropName: 'checked',
        style: { marginBottom: 0 },
        children: <Checkbox>{t(`dicts:${id}.name`)}</Checkbox>
      }))
    }
  ]

  syncServiceIds.forEach(id => {
    const key = `syncService.btn.${id}`
    const title = t(`sync:${id}.title`)
    formItems.push({
      key,
      label: title,
      children: (
        <Button
          onClick={() =>
            setShowSyncServices(showSyncServices => ({
              ...showSyncServices,
              [id]: true
            }))
          }
        >{`${title} (${t(
          syncConfigs?.[id]?.enable ? 'common:enabled' : 'common:disabled'
        )})`}</Button>
      )
    })
  })

  return (
    <>
      <SaladictForm items={formItems} />
      {syncServiceIds.map(id => {
        const SyncComp = syncServiceMap[id]
        return SyncComp
          ? React.createElement(SyncComp, {
              key: id,
              syncConfig: syncConfigs?.[id],
              show: showSyncServices[id],
              onClose: () =>
                setShowSyncServices(showSyncServices => ({
                  ...showSyncServices,
                  [id]: false
                }))
            })
          : null
      })}
    </>
  )
}
