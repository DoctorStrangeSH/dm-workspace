'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addMonsterToCampaign } from '@/lib/actions/bestiary'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { abilityShort } from '@/lib/i18n/labels'
import { monsterCategoryLabel } from '@/lib/srd/monster-display'
import { srdName } from '@/lib/types'
import type { SrdMonster } from '@/lib/actions/bestiary-search'

interface Props {
  monster: SrdMonster
  campaignId: string
  canEdit: boolean
  onClose: () => void
}

function formatModifier(score: number | undefined): string {
  if (typeof score !== 'number' || !Number.isFinite(score)) return '—'
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function MonsterDetailDialog({ monster, campaignId, canEdit, onClose }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const data = monster.data

  const sizeLabel = data.size ? monsterCategoryLabel('size', data.size, t) : ''
  const typeLabel = data.type ? monsterCategoryLabel('type', data.type, t) : ''

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
      closeLabel={t('common.close')}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
            {t('common.close')}
          </Button>
          {canEdit && (
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} aria-hidden="true" />}
              onClick={handleAdd}
              loading={isPending}
            >
              {t('bestiary.addToCampaign')}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-sm [overflow-wrap:anywhere]">
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-3 sm:grid-cols-3">
          {[
            { label: t('bestiary.stats.ac'), value: data.ac ?? '—' },
            { label: t('bestiary.stats.hp'), value: data.hp ?? data.hp_max ?? '—' },
            {
              label: t('characters.speed'),
              value: data.speed != null ? t('common.feetShort', { feet: data.speed }) : '—',
            },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
              <dd className="mt-1 font-semibold text-[var(--text-primary)] tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {abilities.map((a) => (
            <div
              key={a.key}
              className="rounded border border-[var(--border-default)] bg-[var(--bg-app)] p-2 text-center"
            >
              <div className="text-xs text-[var(--text-muted)] uppercase">
                {abilityShort(lang, a.key)}
              </div>
              <div className="text-base font-bold text-[var(--text-primary)]">{a.score ?? '—'}</div>
              <div className="text-xs text-[var(--text-muted)]">{formatModifier(a.score)}</div>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-subtle)] p-3">
          {[
            { label: t('bestiary.stats.cr'), value: data.cr ?? '—' },
            { label: t('bestiary.stats.xp'), value: data.xp ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-[var(--warning-text)]">{label}</dt>
              <dd className="mt-1 font-semibold text-[var(--text-primary)] tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {data.description && (
          <div>
            <h3 className="mb-2 font-semibold text-[var(--text-secondary)]">
              {t('common.description')}
            </h3>
            <div className="leading-relaxed whitespace-pre-wrap text-[var(--text-secondary)]">
              {data.description}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
