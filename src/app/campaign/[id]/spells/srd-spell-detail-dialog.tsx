'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { addSrdSpellToCharacter } from '@/lib/actions/add-spell-to-character'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, Select } from '@/components/ui'
import type { SrdSpell } from '@/lib/actions/spells-search'

interface Props {
  spell: SrdSpell
  campaignId: string
  characters: Array<{ id: string; name: string }>
  onClose: () => void
}

export default function SrdSpellDetailDialog({ spell, campaignId, characters, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedChar, setSelectedChar] = useState<string | null>(characters[0]?.id ?? null)

  const parsed = parseSpellForDisplay(spell.data)

  const handleAdd = () => {
    if (!selectedChar) {
      toast.error('Выбери персонажа')
      return
    }

    startTransition(async () => {
      const res = await addSrdSpellToCharacter(spell.key, selectedChar, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Заклинание добавлено')
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title={spell.name_ru ?? spell.name ?? parsed.name}
      description={`${parsed.level === 0 ? 'Заговор' : `${parsed.level} уровень`}${parsed.school && `, ${parsed.school.toLowerCase()}`}${parsed.ritual && ' (ритуал)'}${parsed.concentration && ' (концентрация)'}`}
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
              Добавить
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--bg-app)] p-3">
          <div>
            <span className="text-[var(--text-muted)]">Время:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.castingTime || '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Дистанция:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.range || '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Компоненты:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.components || '—'}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Длительность:</span>{' '}
            <span className="text-[var(--text-secondary)]">{parsed.duration || '—'}</span>
          </div>
        </div>

        <div className="whitespace-pre-wrap text-[var(--text-secondary)]">
          {parsed.description || 'Описание отсутствует'}
        </div>

        {parsed.higherLevel && (
          <div>
            <h3 className="mb-1 font-semibold text-[var(--accent-text)]">
              На более высоких уровнях
            </h3>
            <div className="whitespace-pre-wrap text-[var(--text-secondary)]">
              {parsed.higherLevel}
            </div>
          </div>
        )}

        {parsed.classes.length > 0 && (
          <div>
            <h3 className="mb-1 font-semibold text-[var(--text-secondary)]">Классы</h3>
            <div className="text-[var(--text-muted)]">{parsed.classes.join(', ')}</div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
