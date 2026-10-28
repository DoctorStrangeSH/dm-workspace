'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { addSpell } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { Input, Textarea, Select, Checkbox, Button, IconButton } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { spellSchoolLabel } from '@/lib/i18n/labels'
import type { SpellSchool } from '@/lib/types'

interface Props {
  characterId: string
  campaignId: string
  onClose: () => void
}

const SCHOOLS: SpellSchool[] = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
]

export default function AddSpellDialog({ characterId, campaignId, onClose }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [level, setLevel] = useState(0)
  const [school, setSchool] = useState<SpellSchool | ''>('')
  const [castingTime, setCastingTime] = useState('')
  const [range, setRange] = useState('')
  const [components, setComponents] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [ritual, setRitual] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(t('spells.form.nameRequired'))
      return
    }

    startTransition(async () => {
      const res = await addSpell(characterId, campaignId, {
        name: name.trim(),
        level,
        school: school || undefined,
        castingTime: castingTime || undefined,
        range: range || undefined,
        components: components || undefined,
        duration: duration || undefined,
        description: description || undefined,
        ritual,
      })

      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }

      toast.success(t('spells.toast.added'))
      router.refresh()
      onClose()
    })
  }

  const levelOptions = [
    { value: '0', label: t('spells.form.cantripOption') },
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => ({
      value: String(l),
      label: t('spells.form.levelOption', { level: l }),
    })),
  ]

  const schoolOptions = [
    { value: '', label: t('spells.form.schoolPlaceholder') },
    ...SCHOOLS.map((s) => ({ value: s, label: spellSchoolLabel(lang, s) })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-[var(--bg-overlay)] p-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] p-3 sm:p-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{t('spells.form.title')}</h2>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common.close')}
            onClick={onClose}
            disabled={isPending}
          >
            <X size={18} />
          </IconButton>
        </div>

        <form id="add-character-spell-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
          <Input
            label={t('common.name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('spells.form.namePlaceholder')}
            autoFocus
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('spells.form.level')}
              value={String(level)}
              onChange={(e) => setLevel(Number(e.target.value))}
              options={levelOptions}
            />

            <Select
              label={t('spells.form.school')}
              value={school}
              onChange={(e) => setSchool(e.target.value as SpellSchool | '')}
              options={schoolOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('spells.form.castingTime')}
              type="text"
              value={castingTime}
              onChange={(e) => setCastingTime(e.target.value)}
              placeholder={t('spells.form.castingTimePlaceholder')}
            />
            <Input
              label={t('spells.form.range')}
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder={t('spells.form.rangePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('spells.form.components')}
              type="text"
              value={components}
              onChange={(e) => setComponents(e.target.value)}
              placeholder={t('spells.form.componentsPlaceholder')}
            />
            <Input
              label={t('spells.form.duration')}
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={t('spells.form.durationPlaceholder')}
            />
          </div>

          <Checkbox
            id="ritual"
            label={t('spells.form.ritual')}
            checked={ritual}
            onChange={(e) => setRitual(e.target.checked)}
          />

          <Textarea
            label={t('spells.form.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t('spells.form.descriptionPlaceholder')}
          />


        </form>
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] p-3 sm:p-4">
            <Button
              type="button"
              variant="secondary"
              size="md" className="min-h-11"
              onClick={onClose}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button form="add-character-spell-form" type="submit" variant="primary" size="md" className="min-h-11" loading={isPending}>
              {isPending ? t('spells.form.adding') : t('common.add')}
            </Button>
          </div>
      </div>
    </div>
  )
}
