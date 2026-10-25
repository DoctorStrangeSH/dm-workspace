'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Map, ChevronDown, ExternalLink } from 'lucide-react'
import { Dropdown } from '@/components/ui'
import { useT } from '@/lib/i18n'
import SceneView from '../scenes/[sceneId]/scene-view'
import type {
  Scene,
  Character,
  Entity,
  Token,
  InitiativeEntryWithToken,
  FogArea,
  SceneWall,
  TokenOwnerWithProfile,
} from '@/lib/types'

interface Props {
  campaignId: string
  scenes: Scene[]
  activeScene: Scene | null
  tokens: Token[]
  characters: Character[]
  monsters: Entity[]
  initiative: InitiativeEntryWithToken[]
  initialFog: FogArea[]
  initialWalls: SceneWall[]
  initialTokenOwners: TokenOwnerWithProfile[]
  currentUserId: string | null
}

export function SessionScenePanel({
  campaignId,
  scenes,
  activeScene,
  tokens,
  characters,
  monsters,
  initiative,
  initialFog,
  initialWalls,
  initialTokenOwners,
  currentUserId,
}: Props) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()

  const setScene = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('scene', id)
    router.push(`/campaign/${campaignId}/session?${params.toString()}`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] p-2">
        <Map size={14} className="shrink-0 text-[var(--success-text)]" />
        <div className="min-w-0 flex-1">
          <Dropdown
            align="left"
            trigger={
              <button className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]">
                <span className="truncate text-[var(--text-primary)]">
                  {activeScene?.name ?? t('session.noScene')}
                </span>
                <ChevronDown size={12} className="shrink-0 text-[var(--text-muted)]" />
              </button>
            }
            items={scenes.map((s) => ({
              label: s.name,
              onClick: () => setScene(s.id),
            }))}
          />
        </div>
        {activeScene && (
          <Link
            href={`/campaign/${campaignId}/scenes/${activeScene.id}`}
            target="_blank"
            className="shrink-0 rounded p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title={t('session.openScene')}
          >
            <ExternalLink size={12} />
          </Link>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {activeScene ? (
          <SceneView
            scene={activeScene}
            tokens={tokens}
            characters={characters}
            monsters={monsters}
            initiative={initiative}
            initialFog={initialFog}
            initialWalls={initialWalls}
            initialSummonRequests={[]}
            initialTokenOwners={initialTokenOwners}
            campaignMembers={[]}
            campaignId={campaignId}
            isDm={true}
            currentUserId={currentUserId}
          />
        ) : (
          <p className="p-4 text-sm text-[var(--text-muted)]">{t('session.selectScene')}</p>
        )}
      </div>
    </div>
  )
}
