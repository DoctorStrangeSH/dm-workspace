'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createSummonRequest } from '@/lib/actions/summon'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Input } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { Entity } from '@/lib/types'

interface Props {
  campaignId: string
  sceneId: string
  monsters: Entity[]
  onClose: () => void
}

export default function SummonDialog({ campaignId, sceneId, monsters, onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [count, setCount] = useState(1)

  const selectedMonster = monsters.find((m) => m.id === selectedMonsterId)

  const handleSubmit = () => {
    const monsterName = selectedMonster?.name ?? customName.trim()
    if (!monsterName) {
      toast.error(t('summon.form.nameRequired'))
      return
    }

    startTransition(async () => {
      const res = await createSummonRequest(campaignId, sceneId, {
        monsterName,
        monsterEntityId: selectedMonster?.id ?? null,
        monsterCount: count,
      })
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(t('summon.toast.sent'))
      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={t('summon.title')}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={14} />}
            onClick={handleSubmit}
            loading={isPending}
          >
            {t('summon.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">{t('summon.description')}</p>

        {monsters.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              {t('summon.form.monster')}
            </label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--border-default)] p-2">
              {monsters.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMonsterId(m.id === selectedMonsterId ? null : m.id)
                    setCustomName('')
                  }}
                  className={
                    selectedMonsterId === m.id
                      ? 'w-full rounded bg-[var(--accent-subtle)] px-3 py-1.5 text-left text-sm text-[var(--accent-text)]'
                      : 'w-full rounded px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }
                >
                  👹 {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!selectedMonster && (
          <Input
            label={t('summon.form.customName')}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={t('summon.form.customNamePlaceholder')}
          />
        )}

        <Input
          label={t('summon.form.count')}
          type="number"
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          min={1}
          max={20}
        />
      </div>
    </Dialog>
  )
}
