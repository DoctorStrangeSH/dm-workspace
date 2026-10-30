'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Moon, Search, X } from 'lucide-react'
import { longRest } from '@/lib/actions/characters'
import { useToast } from '@/components/toast/toast-provider'
import { EmptyState, Button, Dialog } from '@/components/ui'
import CharacterLibraryHeader from '../character-library-header'
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

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [preparedFilter, setPreparedFilter] = useState('all')

  const data: CharacterData = character.data_json

  const spells = useMemo(() => character.data_json.spells ?? [], [character.data_json.spells])
  const slots = data.spellSlots ?? {}

  const filteredSpells = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(lang)
    return spells.filter(
      (spell) =>
        (!term ||
          spell.name.toLocaleLowerCase(lang).includes(term) ||
          (spell.description ?? '').toLocaleLowerCase(lang).includes(term)) &&
        (levelFilter === 'all' || String(spell.level) === levelFilter) &&
        (preparedFilter === 'all' || Boolean(spell.prepared) === (preparedFilter === 'prepared'))
    )
  }, [spells, search, levelFilter, preparedFilter, lang])
  const availableLevels = [...new Set(spells.map((spell) => spell.level))].sort((a, b) => a - b)
  const preparedCount = spells.filter((spell) => spell.prepared).length
  const ritualCount = spells.filter((spell) => spell.ritual).length

  const spellsByLevel = useMemo(() => {
    const groups: Record<number, CharacterSpell[]> = {}
    for (const s of filteredSpells) {
      if (!groups[s.level]) groups[s.level] = []
      groups[s.level].push(s)
    }
    for (const level in groups) {
      groups[level].sort((a, b) => a.name.localeCompare(b.name))
    }
    return groups
  }, [filteredSpells])

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
      <CharacterLibraryHeader
        title={t('spells.library.title')}
        description={t('spells.library.description')}
        catalogHref={`/campaign/${campaignId}/spells`}
        catalogLabel={t('spells.library.catalog')}
      >
        {canEdit && (
          <>
            <Button
              variant="primary"
              size="md"
              className="min-h-12 touch-manipulation"
              icon={<Plus size={18} />}
              onClick={() => setShowAddDialog(true)}
            >
              {t('spells.add')}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="min-h-12 touch-manipulation"
              icon={<Moon size={18} />}
              onClick={() => setShowRestConfirm(true)}
              disabled={isPending}
            >
              {t('spells.longRest')}
            </Button>
          </>
        )}
      </CharacterLibraryHeader>

      <dl aria-label={t('spells.library.summary')} className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: t('common.total'), count: spells.length },
          { label: t('spells.library.preparedCount'), count: preparedCount },
          { label: t('spells.ritual'), count: ritualCount },
        ].map(({ label, count }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
          >
            <dt className="text-xs break-words text-[var(--text-muted)]">{label}</dt>
            <dd className="mt-1 text-xl font-bold text-[var(--text-primary)] tabular-nums">
              {count}
            </dd>
          </div>
        ))}
      </dl>

      <section
        aria-label={t('spells.library.filters')}
        className="mb-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 sm:p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="min-w-0 text-xs text-[var(--text-muted)]">
            {t('spells.library.search')}
            <span className="relative mt-1 block">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute top-4 left-3"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={spells.length === 0}
                placeholder={t('spells.library.searchHint')}
                className="min-h-12 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] py-2 pr-3 pl-10 text-base text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
              />
            </span>
          </label>
          <label className="min-w-0 text-xs text-[var(--text-muted)]">
            {t('spells.library.level')}
            <select
              aria-label={t('spells.library.level')}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              disabled={spells.length === 0}
              className="mt-1 min-h-12 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-base text-[var(--text-primary)]"
            >
              <option value="all">{t('spells.library.allLevels')}</option>
              {availableLevels.map((level) => (
                <option key={level} value={level}>
                  {levelLabel(level)}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-xs text-[var(--text-muted)]">
            {t('spells.library.preparation')}
            <select
              aria-label={t('spells.library.preparation')}
              value={preparedFilter}
              onChange={(e) => setPreparedFilter(e.target.value)}
              disabled={spells.length === 0}
              className="mt-1 min-h-12 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 text-base text-[var(--text-primary)]"
            >
              <option value="all">{t('common.all')}</option>
              <option value="prepared">{t('spells.library.prepared')}</option>
              <option value="unprepared">{t('spells.library.unprepared')}</option>
            </select>
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span role="status">
            {t('spells.library.found', { found: filteredSpells.length, total: spells.length })}
          </span>
          {(search || levelFilter !== 'all' || preparedFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setLevelFilter('all')
                setPreparedFilter('all')
              }}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-[var(--accent-text)] hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <X size={16} aria-hidden="true" />
              {t('spells.library.clear')}
            </button>
          )}
        </div>
      </section>

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
      ) : filteredSpells.length === 0 ? (
        <div
          role="status"
          className="rounded-xl border border-dashed border-[var(--border-default)] p-6 text-center text-sm text-[var(--text-muted)]"
        >
          {t('spells.library.noResults')}
        </div>
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
