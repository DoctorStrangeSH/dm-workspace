'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Moon } from 'lucide-react'
import { longRest } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { EmptyState, Button, Dialog } from '@/components/ui'
import SpellCard from './spell-card'
import SpellSlotsTracker from './spell-slots-tracker'
import AddSpellDialog from './add-spell-dialog'
import { abilityModifier, formatModifier, proficiencyBonus } from '@/lib/dnd/formulas'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import type { Character, CharacterSpell, CharacterData } from '@/lib/types'

interface Props {
  character: Character
  campaignId: string
  canEdit: boolean
}

export default function SpellsTab({ character, campaignId, canEdit }: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRestConfirm, setShowRestConfirm] = useState(false)

  const data: CharacterData = character.data_json

  const spells = useMemo(() => character.data_json.spells ?? [], [character.data_json.spells])
  const slots = data.spellSlots ?? {}

  const spellsByLevel = useMemo(() => {
    const groups: Record<number, CharacterSpell[]> = {}
    for (const s of spells) {
      if (!groups[s.level]) groups[s.level] = []
      groups[s.level].push(s)
    }
    for (const level in groups) {
      groups[level].sort((a, b) => a.name.localeCompare(b.name))
    }
    return groups
  }, [spells])

  const doLongRest = () => {
    startTransition(async () => {
      const res = await longRest(character.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('spells.toast.longRestDone'))
        router.refresh()
      }
      setShowRestConfirm(false)
    })
  }

  const handleRoll = (spell: CharacterSpell) => {
    const spellAbility = data.spellcastingAbility
    if (!spellAbility) {
      toast.info(spell.name, {
        description: t('spells.noCastingAbility'),
      })
      return
    }

    const mod = abilityModifier(data.abilities[spellAbility])
    const prof = proficiencyBonus(data.level)
    const bonus = mod + prof
    const roll = Math.floor(Math.random() * 20) + 1
    const total = roll + bonus

    toast.info(`${spell.name}: ${formatModifier(bonus)} = ${total}`, {
      description: t('spells.spellAttackDesc', {
        roll,
        modifier: formatModifier(bonus),
      }),
    })
  }

  const levelKeys = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b)

  const levelLabel = (level: number) => {
    if (level === 0) return t('spells.cantrips')
    const word = pluralize(lang, level, {
      one: t('spells.levelWord.one'),
      few: t('spells.levelWord.few'),
      many: t('spells.levelWord.many'),
    })
    return t('spells.levelLabel', { level, word })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canEdit && (
          <>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowAddDialog(true)}
            >
              {t('spells.add')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={<Moon size={14} />}
              onClick={() => setShowRestConfirm(true)}
              disabled={isPending}
            >
              {t('spells.longRest')}
            </Button>
          </>
        )}

        <div className="ml-auto text-sm text-[var(--text-muted)]">
          {t('common.total')}: {spells.length}
        </div>
      </div>

      <SpellSlotsTracker
        characterId={character.id}
        campaignId={campaignId}
        slots={slots}
        canEdit={canEdit}
      />

      {spells.length === 0 ? (
        <EmptyState
          icon="✨"
          title={t('spells.empty.title')}
          description={
            canEdit ? t('spells.empty.descriptionEdit') : t('spells.empty.descriptionPlayer')
          }
          size="md"
          dashed={false}
        />
      ) : (
        <div className="space-y-4">
          {levelKeys.map((level) => (
            <div key={level}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                <Sparkles size={14} className="text-[var(--accent-text)]" />
                {levelLabel(level)}
                <span className="font-normal text-[var(--text-subtle)]">
                  ({spellsByLevel[level].length})
                </span>
              </h3>

              <div className="space-y-1.5">
                {spellsByLevel[level].map((spell) => (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    characterId={character.id}
                    campaignId={campaignId}
                    canEdit={canEdit}
                    onRoll={handleRoll}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddDialog && (
        <AddSpellDialog
          characterId={character.id}
          campaignId={campaignId}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={showRestConfirm}
        onClose={() => !isPending && setShowRestConfirm(false)}
        title={t('spells.longRestConfirm.title')}
        description={t('spells.longRestConfirm.description')}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowRestConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="md" onClick={doLongRest} loading={isPending}>
              {t('spells.longRestConfirm.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('spells.longRestConfirm.hint')}</p>
      </Dialog>
    </div>
  )
}
