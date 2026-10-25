'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addMonsterToCampaign } from '@/lib/actions/bestiary'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { abilityShort } from '@/lib/i18n/labels'
import { srdName } from '@/lib/types'
import type { SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  monster: SrdMonster
  campaignId: string
  canEdit: boolean
  onClose: () => void
}

function formatModifier(score: number | undefined): string {
  const mod = Math.floor(((score ?? 10) - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function MonsterDetailDialog({ monster, campaignId, canEdit, onClose }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const data = monster.data

  const sizeLabel = data.size ? t(`monsterSize.${data.size.toLowerCase()}`) : ''
  const typeLabel = data.type ? t(`monsterType.${data.type.toLowerCase()}`) : ''

  const handleAdd = () => {
    startTransition(async () => {
      const res = await addMonsterToCampaign(monster.key, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('bestiary.toast.addedToCampaign'))
        router.refresh()
        onClose()
      }
    })
  }

  const abilities = [
    { key: 'str' as const, score: data.abilities?.str },
    { key: 'dex' as const, score: data.abilities?.dex },
    { key: 'con' as const, score: data.abilities?.con },
    { key: 'int' as const, score: data.abilities?.int },
    { key: 'wis' as const, score: data.abilities?.wis },
    { key: 'cha' as const, score: data.abilities?.cha },
  ]

  const description = [sizeLabel, typeLabel, data.alignment].filter(Boolean).join(', ')

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={srdName(monster, lang)}
      description={description}
      size="lg"
      footer={
        canEdit ? (
          <>
            <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
              {t('common.close')}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={14} />}
              onClick={handleAdd}
              loading={isPending}
            >
              {t('bestiary.addToCampaign')}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4 text-sm">
        <div className="space-y-1 rounded-lg bg-[var(--bg-app)] p-3">
          <div>
            <span className="text-[var(--text-muted)]">AC:</span>{' '}
            <span className="text-[var(--text-secondary)]">{data.ac ?? '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">HP:</span>{' '}
            <span className="text-[var(--text-secondary)]">{data.hp ?? '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">{t('characters.speed')}:</span>{' '}
            <span className="text-[var(--text-secondary)]">
              {data.speed ? t('common.feetShort', { feet: data.speed }) : '—'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {abilities.map((a) => (
            <div
              key={a.key}
              className="rounded border border-[var(--border-default)] bg-[var(--bg-app)] p-2 text-center"
            >
              <div className="text-[10px] text-[var(--text-subtle)] uppercase">
                {abilityShort(lang, a.key)}
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">{a.score ?? 10}</div>
              <div className="text-[10px] text-[var(--text-subtle)]">{formatModifier(a.score)}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-subtle)] p-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <strong className="text-[var(--warning-text)]">CR:</strong>{' '}
              <span className="text-[var(--text-secondary)]">{data.cr ?? '—'}</span>
            </div>
            <div>
              <strong className="text-[var(--warning-text)]">XP:</strong>{' '}
              <span className="text-[var(--text-secondary)]">{data.xp ?? '—'}</span>
            </div>
          </div>
        </div>

        {data.description && (
          <div>
            <h3 className="mb-2 font-semibold text-[var(--text-secondary)]">
              {t('common.description')}
            </h3>
            <div className="text-xs whitespace-pre-wrap text-[var(--text-muted)]">
              {data.description}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
