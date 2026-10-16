export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { BookOpen } from 'lucide-react'
import CreateChapterButton from './create-chapter-button'
import ChaptersList from './chapters-list'
import type { Chapter } from '@/lib/types'

export default async function ChaptersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(id)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('campaign_id', id)
    .order('order_index', { ascending: true })

  if (error) console.error('chapters query error:', error)

  const list = (chapters ?? []) as Chapter[]

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={22} className="text-indigo-400" />
            Главы
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {list.length} {list.length === 1 ? 'глава' : 'глав'}
            {!isDm && ' · только видимые вам'}
          </p>
        </div>
        {isDm && <CreateChapterButton campaignId={id} />}
      </div>

      <ChaptersList
        campaignId={id}
        initialChapters={list}
        isDm={isDm}
      />
    </div>
  )
}