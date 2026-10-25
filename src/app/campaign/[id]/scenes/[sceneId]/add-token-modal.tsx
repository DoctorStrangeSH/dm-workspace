'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, User, Skull } from 'lucide-react'
import { createToken } from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { Button, IconButton, Input, Tabs } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { Scene, Character, Entity } from '@/lib/types'

interface Props {
  scene: Scene
  characters: Character[]
  monsters: Entity[]
  onClose: () => void
}

type Tab = 'character' | 'monster' | 'custom'

type MonsterDataJson = {
  hp?: number | string
  hit_points?: number | string
  hp_max?: number | string
}

function parseMonsterHP(
  raw: unknown,
  avgTemplate: (vars: { avg: number }) => string
): [string, number | null] {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return [String(raw), raw]
  }
  if (typeof raw === 'string') {
    const firstNum = raw.match(/^\s*(\d+)/)
    if (firstNum) {
      const n = parseInt(firstNum[1], 10)
      if (n > 0) return [raw, n]
    }
    const dice = raw.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
    if (dice) {
      const [, n, d, mod] = dice
      const avg = Math.floor((Number(n) * (Number(d) + 1)) / 2) + Number(mod ?? 0)
      return [`${raw} ${avgTemplate({ avg })}`, avg]
    }
  }
  return ['—', null]
}

export default function AddTokenModal({ scene, characters, monsters, onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('character')
  const [customName, setCustomName] = useState('')

  const TAB_ITEMS = [
    { value: 'character', label: t('scenes.addToken.tab.character'), icon: <User size={14} /> },
    { value: 'monster', label: t('scenes.addToken.tab.monster'), icon: <Skull size={14} /> },
    { value: 'custom', label: t('scenes.addToken.tab.custom'), icon: <Plus size={14} /> },
  ]

  const avgTemplate = (vars: { avg: number }) => t('scenes.addToken.hpAverage', vars)

  const handleAdd = (
    name: string,
    data: {
      characterId?: string
      entityId?: string
      owner_id?: string
      hp_current?: number
      hp_max?: number
    }
  ) => {
    startTransition(async () => {
      const res = await createToken(scene.id, {
        name,
        x: Math.floor(scene.width / 2),
        y: Math.floor(scene.height / 2),
        ...data,
      })
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('scenes.toast.tokenAdded'))
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{t('scenes.addToken.title')}</h2>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common.close')}
            onClick={onClose}
            disabled={isPending}
          >
            <span className="text-lg leading-none">✕</span>
          </IconButton>
        </div>

        <div className="border-b border-[var(--border-default)] p-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} items={TAB_ITEMS} />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'character' && (
            <div className="space-y-1">
              {characters.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                  {t('scenes.addToken.noCharacters')}
                </p>
              ) : (
                characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() =>
                      handleAdd(char.name, {
                        characterId: char.id,
                        owner_id: char.user_id,
                        hp_current: char.data_json.hp.current,
                        hp_max: char.data_json.hp.max,
                      })
                    }
                    disabled={isPending}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--warning)]/30 bg-[var(--warning-subtle)]">
                      ⚔️
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {char.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {t('scenes.hpValue', {
                          current: char.data_json.hp.current,
                          max: char.data_json.hp.max,
                        })}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {tab === 'monster' && (
            <div className="space-y-1">
              {monsters.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                  {t('scenes.addToken.noMonsters')}
                </p>
              ) : (
                monsters.map((m) => {
                  const dj: MonsterDataJson =
                    typeof m.data_json === 'string'
                      ? (JSON.parse(m.data_json) as MonsterDataJson)
                      : (m.data_json as MonsterDataJson)
                  const rawHp = dj.hp ?? dj.hit_points ?? dj.hp_max
                  const [hpDisplay, hpNum] = parseMonsterHP(rawHp, avgTemplate)
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        handleAdd(m.name, {
                          entityId: m.id,
                          hp_current: hpNum ?? undefined,
                          hp_max: hpNum ?? undefined,
                        })
                      }
                      disabled={isPending}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--danger)]/30 bg-[var(--danger-subtle)]">
                        👹
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {m.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {t('scenes.addToken.hpDisplay', { hp: hpDisplay })}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-3">
              <Input
                label={t('scenes.addToken.customName')}
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t('scenes.addToken.customNamePlaceholder')}
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAdd(customName || t('scenes.addToken.defaultName'), {})}
                loading={isPending}
                className="w-full"
              >
                {isPending ? t('scenes.addToken.creating') : t('scenes.addToken.create')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
