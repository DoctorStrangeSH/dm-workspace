export const instant = false

import { connection } from 'next/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getChapterEntities } from '@/lib/queries/backlinks'
import { ArrowLeft, EyeOff, Eye } from 'lucide-react'
import ChapterEditor from './chapter-editor'
import ChapterEntities from './chapter-entities'
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

  // Подтягиваем все сущности кампании
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

  // Сущности, упомянутые в этой главе
  const chapterEntities = await getChapterEntities(chapterId)

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/campaign/${campaignId}/chapters`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition mb-3"
        >
          <ArrowLeft size={14} />
          К списку глав
        </Link>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{ch.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
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
                      <Eye size={12} className="text-green-400" />
                      <span className="text-green-400">
                        Видна игрокам
                      </span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={12} className="text-amber-400" />
                      <span className="text-amber-400">
                        Скрыта от игроков
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChapterEditor
        chapterId={ch.id}
        campaignId={campaignId}
        initialContent={ch.content_md}
        readOnly={!isDm}
        entityMap={entityMap}
        entities={entities}
        chapterTitle={ch.title}
      />

      <div className="mt-6">
        <ChapterEntities
          campaignId={campaignId}
          entities={chapterEntities}
        />
      </div>
    </div>
  )
}