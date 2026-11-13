'use client'

import { Shield, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { characterClassName, characterSpeciesName } from '@/lib/dnd/character-display-names'
import { abilityShort } from '@/lib/i18n/labels'
import { abilityModifier, formatModifier } from '@/lib/dnd/formulas'
import type { CharacterData, AbilityKey } from '@/lib/types'

export default function WizardPreview({
  name,
  data,
  hasBackground,
}: {
  name: string
  data: CharacterData | null
  hasBackground: boolean
}) {
  const { t, lang } = useI18n()
  return (
    <aside
      aria-label={t('prep.preview')}
      className="min-w-0 rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-surface)] p-5 xl:sticky xl:top-[calc(var(--campaign-header-height,10rem)+1rem)]"
    >
      <h2 className="flex items-center gap-2 font-semibold text-[var(--accent-text)]">
        <Sparkles size={18} />
        {t('prep.preview')}
      </h2>
      <p className="mt-4 text-xl font-bold break-words text-[var(--text-primary)]">
        {name.trim() || t('prep.unnamed')}
      </p>
      {data ? (
        <>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {characterSpeciesName(data.race, lang)} · {characterClassName(data.class, lang)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            {[
              [t('sheet.hp'), data.hp.max],
              [t('sheet.ac'), data.ac],
              [t('sheet.speed'), data.speed],
              [t('characters.initiative'), formatModifier(abilityModifier(data.abilities.dex))],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[var(--bg-app)] p-3">
                <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
                <dd className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map((key) => (
              <div
                key={key}
                className="rounded-lg border border-[var(--border-default)] p-2 text-center"
              >
                <p className="text-xs text-[var(--text-muted)]">{abilityShort(lang, key)}</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {data.abilities[key]}
                </p>
                <p className="text-xs text-[var(--accent-text)]">
                  {formatModifier(abilityModifier(data.abilities[key]))}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{t('prep.bonuses')}</p>
          {!hasBackground && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">{t('prep.backgroundLater')}</p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {t('prep.previewHint')}
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 border-t border-[var(--border-default)] pt-4 text-xs leading-5 text-[var(--text-muted)]">
        <Shield size={16} className="shrink-0" />
        {t('prep.creationHint')}
      </p>
    </aside>
  )
}
