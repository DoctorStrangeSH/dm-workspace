'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addSrdSpellToCharacter } from '@/lib/actions/add-spell-to-character'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Select } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { srdName } from '@/lib/types'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  campaignId: string
  characters: Array<{ id: string; name: string }>
  onClose: () => void
}

export default function SrdSpellDetailDialog({ spell, campaignId, characters, onClose }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedChar, setSelectedChar] = useState<string | null>(characters[0]?.id ?? null)

  const parsed = parseSpellForDisplay(spell.data)
  const schoolKey = parsed.school.toLowerCase()

  const levelLabel =
    parsed.level === 0 ? t('spells.cantrip') : t('spells.levelFull', { level: parsed.level })

  const descriptionParts = [levelLabel, t(`school.${schoolKey}`)]
  if (parsed.ritual) descriptionParts.push(t('spells.ritual'))
  if (parsed.concentration) descriptionParts.push(t('spells.concentration'))

  const handleAdd = () => {
    if (!selectedChar) {
      toast.error(t('spells.selectCharacter'))
      return
    }

    startTransition(async () => {
      const res = await addSrdSpellToCharacter(spell.key, selectedChar, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('spells.toast.addedToCharacter'))
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={srdName(spell, lang)}
      description={descriptionParts.join(', ')}
      size="lg"
      footer={
        characters.length > 0 ? (
          <div className="flex w-full items-center gap-2">
            <Select
              value={selectedChar ?? ''}
              onChange={(e) => setSelectedChar(e.target.value)}
              options={characters.map((c) => ({ value: c.id, label: c.name }))}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={14} />}
              onClick={handleAdd}
              loading={isPending}
            >
              {t('common.add')}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-app)] p-3">
          <div>
            <span className="text-[var(--text-muted)]">{t('spells.castingTime')}:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.castingTime || '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">{t('spells.range')}:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.range || '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">{t('spells.components')}:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.components || '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">{t('spells.duration')}:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.duration || '—'}</span>
          </div>
        </div>

        <div className="whitespace-pre-wrap text-[var(--text-secondary)]">
          {parsed.description || t('spells.noDescription')}
        </div>

        {parsed.higherLevel && (
          <div>
            <h3 className="mb-1 font-semibold text-[var(--accent-text)]">
              {t('spells.higherLevel')}
            </h3>
            <div className="whitespace-pre-wrap text-[var(--text-secondary)]">
              {parsed.higherLevel}
            </div>
          </div>
        )}

        {parsed.classes.length > 0 && (
          <div>
            <h3 className="mb-1 font-semibold text-[var(--text-secondary)]">
              {t('spells.classes')}
            </h3>
            <div className="text-[var(--text-muted)]">{parsed.classes.join(', ')}</div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
