'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, TrendingUp, Sword } from 'lucide-react'
import { updateCharacter, updateCharacterIdentityAtomic } from '@/lib/actions/characters'
import { characterIdentityPatch } from '@/lib/dnd/character-identity-patch'
import { CLASSES } from '@/lib/dnd/constants'
import { SRD_SUBCLASS_BASE, baseClassSlug } from '@/lib/dnd/srd-class-utils'
import { useToast } from '@/components/toast/toast-provider'
import { Breadcrumbs } from '@/components/breadcrumbs'
import AbilityBox from './ability-box'
import CombatStats from './combat-stats'
import HPTracker from './hp-tracker'
import HPValidationNotice from './hp-validation-notice'
import { readCharacterHP } from '@/lib/dnd/character-hp'
import DeathSavesTracker from './death-saves-tracker'
import SkillsList from './skills-list'
import SavesList from './saves-list'
import CharacterTabs from './character-tabs'
import SpellsTab from './spells/spells-tab'
import InventoryTab from './inventory-tab'
import FeaturesTab from './features-tab'
import LevelUpDialog from './level-up-dialog'
import { Card, Button, IconButton, Dialog } from '@/components/ui'
import {
  abilityModifier,
  formatModifier,
  getSaveBonus,
  getSkillBonus,
  getInitiative,
  getPassivePerception,
  proficiencyBonus,
  parseDice,
  rollDice,
} from '@/lib/dnd/formulas'
import { characterClassName, characterSpeciesName } from '@/lib/dnd/character-display-names'
import { subclassDisplayName } from '@/lib/dnd/srd-class-utils'
import type { AbilityKey, SkillKey, Character } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { abilityLabel, abilityShort, skillLabel } from '@/lib/i18n/labels'

interface Props {
  character: Character
  campaignId: string
  campaignName: string
  owner: { display_name: string | null; username: string }
  canEdit: boolean
  isDm: boolean
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function CharacterSheet({
  character,
  campaignId,
  campaignName,
  owner,
  canEdit,
}: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(character.name)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [isEditingClass, setIsEditingClass] = useState(false)
  const [editClass, setEditClass] = useState(baseClassSlug(character.data_json.class))
  const [editSubclass, setEditSubclass] = useState(character.data_json.subclass ?? '')
  const [classChange, setClassChange] = useState<{ class: string; subclass?: string } | null>(null)
  const classSaveInFlight = useRef(false)
  const closeClassConfirmation = useCallback(() => {
    if (!classSaveInFlight.current) setClassChange(null)
  }, [])

  const data = character.data_json
  const hp = readCharacterHP(data.hp)
  const canEditData = canEdit && hp !== null
  const hasIdentityChanges = editClass !== data.class || editSubclass !== (data.subclass ?? '')
  const profBonus = proficiencyBonus(data.level)

  const handleSaveName = () => {
    if (editName.trim() === character.name) {
      setIsEditingName(false)
      return
    }
    startTransition(async () => {
      const res = await updateCharacter(character.id, campaignId, {
        name: editName,
      })
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        setEditName(character.name)
      } else {
        toast.success(t('characters.toast.nameUpdated'))
        setIsEditingName(false)
        router.refresh()
      }
    })
  }

  const requestClassChange = () => {
    if (!hasIdentityChanges || isPending || !canEdit) return
    const patch = characterIdentityPatch(data.class, editClass, editSubclass || undefined)
    if (!patch) {
      toast.error(t('characters.identity.invalid'))
      return
    }
    setClassChange(patch)
  }

  const handleSaveClass = () => {
    if (!classChange || classSaveInFlight.current || isPending || !canEdit) return
    classSaveInFlight.current = true
    const change = classChange
    startTransition(async () => {
      try {
        const res = await updateCharacterIdentityAtomic(
          character.id,
          campaignId,
          change.class,
          change.subclass
        )
        if ('error' in res) {
          toast.error(res.error)
        } else {
          toast.success(t('characters.identity.updated'))
          setClassChange(null)
          setIsEditingClass(false)
          router.refresh()
        }
      } catch {
        toast.error(t('common.error'))
      } finally {
        classSaveInFlight.current = false
      }
    })
  }

  const rollAbility = (ability: AbilityKey) => {
    const mod = abilityModifier(data.abilities[ability])
    const expr = parseDice(`1d20${mod >= 0 ? '+' : ''}${mod}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(`${abilityLabel(lang, ability)}: ${formatModifier(mod)} = ${result.total}`, {
      description: `[${result.rolls.join(', ')}] ${formatModifier(mod)}`,
    })
  }

  const rollSave = (ability: AbilityKey) => {
    const bonus = getSaveBonus(data, ability)
    const expr = parseDice(`1d20${bonus >= 0 ? '+' : ''}${bonus}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(
      `${t('characters.save')} ${abilityShort(lang, ability)}: ${formatModifier(bonus)} = ${result.total}`,
      {
        description: `[${result.rolls.join(', ')}] ${formatModifier(bonus)}`,
      }
    )
  }

  const rollSkill = (skill: SkillKey) => {
    const bonus = getSkillBonus(data, skill)
    const expr = parseDice(`1d20${bonus >= 0 ? '+' : ''}${bonus}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(`${skillLabel(lang, skill)}: ${formatModifier(bonus)} = ${result.total}`, {
      description: `[${result.rolls.join(', ')}] ${formatModifier(bonus)}`,
    })
  }

  const rollInitiative = () => {
    const bonus = getInitiative(data)
    const expr = parseDice(`1d20${bonus >= 0 ? '+' : ''}${bonus}`)
    if (!expr) return
    const result = rollDice(expr)
    toast.info(`${t('characters.initiative')}: ${formatModifier(bonus)} = ${result.total}`, {
      description: `[${result.rolls.join(', ')}] ${formatModifier(bonus)}`,
    })
  }

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaignName, href: `/campaign/${campaignId}` },
          { label: t('nav.characters'), href: `/campaign/${campaignId}/characters` },
          { label: character.name },
        ]}
        className="mb-4"
      />

      <Card
        padding="lg"
        className="relative mb-5 overflow-hidden rounded-2xl border-[var(--border-default)] bg-[linear-gradient(115deg,var(--bg-surface),var(--bg-secondary))] shadow-[var(--shadow-sm)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-14 h-60 w-60 rounded-full border border-[var(--accent)]/15"
        >
          <div className="absolute inset-10 rounded-full border border-[var(--accent)]/10" />
        </div>
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-[var(--accent-text)]">
            <Sword size={30} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="mb-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setEditName(character.name)
                      setIsEditingName(false)
                    }
                  }}
                  autoFocus
                  className="max-w-full min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xl font-bold text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('common.save')}
                  onClick={handleSaveName}
                  disabled={isPending}
                  className="text-[var(--success)]"
                >
                  <Check size={16} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('common.cancel')}
                  onClick={() => {
                    setEditName(character.name)
                    setIsEditingName(false)
                  }}
                >
                  <X size={16} />
                </IconButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight break-words text-[var(--text-primary)] sm:text-3xl">
                  {character.name}
                </h1>
                {canEdit && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    label={t('characters.editName')}
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil size={14} />
                  </IconButton>
                )}
              </div>
            )}

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {characterSpeciesName(data.race, lang)} · {characterClassName(data.class, lang)}
              {data.subclass ? ` (${subclassDisplayName(data.subclass, lang)})` : ''} ·{' '}
              {t('characters.level', { level: data.level })}
            </p>
            {canEdit && (
              <div className="mt-2">
                {!isEditingClass ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditClass(baseClassSlug(data.class))
                      setEditSubclass(data.subclass ?? '')
                      setIsEditingClass(true)
                    }}
                  >
                    {t('characters.identity.edit')}
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--border-default)] p-3">
                    <label className="min-w-40 flex-1 text-xs text-[var(--text-muted)]">
                      {t('characters.identity.class')}
                      <select
                        aria-label={t('characters.identity.classLabel')}
                        value={editClass}
                        onChange={(e) => {
                          setEditClass(e.target.value)
                          setEditSubclass('')
                        }}
                        className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-sm text-[var(--text-primary)]"
                      >
                        {CLASSES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {characterClassName(c.slug, lang)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="min-w-40 flex-1 text-xs text-[var(--text-muted)]">
                      {t('characters.identity.subclass')}
                      <select
                        aria-label={t('characters.identity.subclassLabel')}
                        value={editSubclass}
                        onChange={(e) => setEditSubclass(e.target.value)}
                        className="mt-1 min-h-11 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-sm text-[var(--text-primary)]"
                      >
                        <option value="">{t('characters.identity.noSubclass')}</option>
                        {Object.entries(SRD_SUBCLASS_BASE)
                          .filter(([, base]) => base === editClass)
                          .map(([key]) => (
                            <option key={key} value={key}>
                              {subclassDisplayName(key, lang)}
                            </option>
                          ))}
                      </select>
                    </label>
                    <Button
                      size="md"
                      className="min-h-11"
                      onClick={requestClassChange}
                      disabled={isPending || !hasIdentityChanges}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      className="min-h-11"
                      onClick={() => setIsEditingClass(false)}
                      disabled={isPending}
                    >
                      {t('common.cancel')}
                    </Button>
                    <p className="w-full text-xs text-[var(--text-muted)]">
                      {t('characters.identity.hint')}
                    </p>
                  </div>
                )}
              </div>
            )}
            <p className="mt-0.5 text-xs text-[var(--text-subtle)]">
              {t('characters.owner')}: {owner.display_name ?? owner.username}
            </p>

            {canEdit && data.level < 20 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<TrendingUp size={12} />}
                onClick={() => setShowLevelUp(true)}
                disabled={!hp}
                aria-describedby={!hp ? 'character-hp-notice-title' : undefined}
                className="mt-3 border-[var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success-text)]"
              >
                {t('characters.levelUpFrom', { from: data.level, to: data.level + 1 })}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {!hp && <HPValidationNotice character={character} />}

      <CharacterTabs
        overviewContent={
          <>
            <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITIES.map((ability) => (
                <AbilityBox
                  key={ability}
                  ability={ability}
                  score={data.abilities[ability]}
                  modifier={abilityModifier(data.abilities[ability])}
                  onRoll={() => rollAbility(ability)}
                />
              ))}
            </div>

            <div className="mb-4">
              <CombatStats
                ac={data.ac}
                initiative={getInitiative(data)}
                speed={data.speed}
                passivePerception={getPassivePerception(data)}
                onRollInitiative={rollInitiative}
              />
            </div>

            <div className="mb-4">
              <HPTracker
                characterId={character.id}
                campaignId={campaignId}
                hp={data.hp}
                canEdit={canEdit}
              />
            </div>

            {hp?.current === 0 && (
              <div className="mb-4">
                <DeathSavesTracker
                  characterId={character.id}
                  campaignId={campaignId}
                  deathSaves={
                    data.deathSaves ?? {
                      successes: 0,
                      failures: 0,
                      stabilized: false,
                    }
                  }
                  canEdit={canEdit}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SavesList
                proficientSaves={data.proficientSaves ?? []}
                getBonus={(ability) => getSaveBonus(data, ability)}
                onRoll={rollSave}
              />
              <SkillsList
                proficientSkills={data.proficientSkills ?? []}
                proficiencyBonus={profBonus}
                getBonus={(skill) => getSkillBonus(data, skill)}
                onRoll={rollSkill}
              />
            </div>
          </>
        }
        spellsContent={
          <SpellsTab character={character} campaignId={campaignId} canEdit={canEditData} />
        }
        inventoryContent={
          <InventoryTab character={character} campaignId={campaignId} canEdit={canEditData} />
        }
        featuresContent={<FeaturesTab />}
      />

      <Dialog
        open={classChange !== null}
        onClose={closeClassConfirmation}
        title={t('characters.identity.confirmTitle')}
        description={t('characters.identity.confirmDescription')}
        closeLabel={t('common.close')}
        closeDisabled={isPending}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={closeClassConfirmation}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button size="md" onClick={handleSaveClass} loading={isPending}>
              {t('characters.identity.confirm')}
            </Button>
          </>
        }
      >
        {classChange && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: t('characters.identity.before'),
                  class: data.class,
                  subclass: data.subclass,
                },
                { label: t('characters.identity.after'), ...classChange },
              ].map((identity) => (
                <div
                  key={identity.label}
                  className="min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
                >
                  <p className="text-xs text-[var(--text-muted)]">{identity.label}</p>
                  <p className="mt-1 font-semibold text-[var(--text-primary)]">
                    {characterClassName(identity.class, lang)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {identity.subclass
                      ? subclassDisplayName(identity.subclass, lang)
                      : t('characters.identity.noSubclass')}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('characters.identity.preserved')}
            </p>
            <p className="text-sm text-[var(--warning-text)]">
              {t('characters.identity.rulesHint')}
            </p>
          </div>
        )}
      </Dialog>

      {showLevelUp && hp && (
        <LevelUpDialog
          character={character}
          campaignId={campaignId}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  )
}
