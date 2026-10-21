export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { EyeOff, Eye } from 'lucide-react'
import ChapterEditorLazy from './chapter-editor-lazy'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Chapter } from '@/lib/types'
import type { EntitySuggestion } from '@/lib/codemirror/wikilink-completion'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>
}) {
  await connection()

  const { id: campaignId, chapterId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()
  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)
    .single()

  if (error || !chapter) notFound()

  const ch = chapter as Chapter

  if (!isDm && !ch.is_visible_to_players) notFound()

  const { data: allEntities } = await supabase
    .from('entities')
    .select('id, name, type')
    .eq('campaign_id', campaignId)
    .order('name')

  const entityMap: Record<string, string> = {}
  for (const e of allEntities ?? []) {
    entityMap[e.name] = e.id
  }

  const entities: EntitySuggestion[] = (allEntities ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
  }))

  return (
    <div className="max-w-6xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Главы', href: `/campaign/${campaignId}/chapters` },
          { label: ch.title },
        ]}
        className="mb-4"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{ch.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>
            Обновлено:{' '}
            {new Date(ch.updated_at).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isDm && (
            <span className="flex items-center gap-1">
              {ch.is_visible_to_players ? (
                <>
                  <Eye size={12} className="text-[var(--success)]" />
                  <span className="text-[var(--success)]">Видна игрокам</span>
                </>
              ) : (
                <>
                  <EyeOff size={12} className="text-[var(--warning)]" />
                  <span className="text-[var(--warning)]">Скрыта от игроков</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <ChapterEditorLazy
        chapterId={ch.id}
        campaignId={campaignId}
        initialContent={ch.content_md}
        readOnly={!isDm}
        entityMap={entityMap}
        entities={entities}
        chapterTitle={ch.title}
      />
    </div>
  )
}
