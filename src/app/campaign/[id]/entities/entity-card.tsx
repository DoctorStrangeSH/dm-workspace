'use client'

import Link from 'next/link'
import { Eye, EyeOff, Link2 } from 'lucide-react'
import { ENTITY_STYLES } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import { questStatus, type EntityLibraryCard } from '@/lib/quest-journal'

export type EntityCardData = EntityLibraryCard

interface Props {
  entity: EntityCardData
  campaignId: string
  isDm: boolean
  backlinksCount?: number
}

export default function EntityCard({ entity, campaignId, isDm, backlinksCount = 0 }: Props) {
  const { t, lang } = useI18n()
  const style = ENTITY_STYLES[entity.type]

  const mentionsLabel = pluralize(lang, backlinksCount, {
    one: t('entities.mentions.one'),
    few: t('entities.mentions.few'),
    many: t('entities.mentions.many'),
  })

  return (
    <Link href={`/campaign/${campaignId}/entities/${entity.id}`} className="group block">
      <Card padding="md" hoverable className="h-full">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg',
              style.bg,
              style.border
            )}
          >
            {style.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-text)]">
                {entity.name}
              </h3>
              {isDm && !entity.is_visible_to_players && (
                <span title={t('entities.hidden')} className="mt-1 shrink-0">
                  <EyeOff size={14} className="text-[var(--warning)]" />
                </span>
              )}
              {isDm && entity.is_visible_to_players && (
                <span title={t('entities.visible')} className="mt-1 shrink-0">
                  <Eye size={14} className="text-[var(--success)]/60" />
                </span>
              )}
            </div>

            <div className="mb-2 text-xs text-[var(--text-muted)]">{t(style.labelKey)}</div>

            {entity.type === 'quest' && (
              <div className="mb-3 inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
                {t(
                  questStatus(entity.quest?.status) === 'unset'
                    ? 'questJournal.status.unset'
                    : `questStatus.${questStatus(entity.quest?.status)}`
                )}
              </div>
            )}

            {entity.description && (
              <p className="line-clamp-2 text-sm text-[var(--text-muted)]">{entity.description}</p>
            )}

            {entity.quest &&
              (entity.quest.giver || entity.quest.location || entity.quest.reward) && (
                <dl className="mt-3 space-y-2 border-t border-[var(--border-default)] pt-3 text-xs">
                  {(['giver', 'location', 'reward'] as const).map((field) =>
                    entity.quest?.[field] ? (
                      <div key={field}>
                        <dt className="text-[var(--text-muted)]">
                          {t(`entityField.quest.${field}`)}
                        </dt>
                        <dd
                          className="line-clamp-2 break-words text-[var(--text-secondary)]"
                          title={entity.quest[field]}
                        >
                          {entity.quest[field]}
                        </dd>
                      </div>
                    ) : null
                  )}
                </dl>
              )}

            {backlinksCount > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-[var(--text-subtle)]">
                <Link2 size={12} />
                <span>
                  {backlinksCount} {mentionsLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
