'use client'

import { useDmScreenContext } from './dm-screen-context'
import DmEntityList from './dm-entity-list'
import { useT } from '@/lib/i18n'
import { WorkspacePanel } from '../workspace-panel'
import type { Entity } from '@/lib/types'

export default function DmScreenPanel({
  entities,
  campaignId,
}: {
  entities: Entity[]
  campaignId: string
}) {
  const t = useT()
  const { isOpen, close, recentIds, addToRecent } = useDmScreenContext()
  return (
    <WorkspacePanel
      id="campaign-dm"
      open={isOpen}
      onClose={close}
      title={t('dmScreen.title')}
      description={t('workspace.dmDescription')}
      isDm
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <DmEntityList
          entities={entities}
          campaignId={campaignId}
          recentIds={recentIds}
          onSelect={(entityId) => {
            addToRecent(entityId)
            close()
          }}
        />
      </div>
    </WorkspacePanel>
  )
}
