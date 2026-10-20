export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { BookOpen } from 'lucide-react'
import CreateChapterButton from './create-chapter-button'
import ChaptersList from './chapters-list'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Chapter } from '@/lib/types'

export default async function ChaptersPage({ params }: { params: Promise<{ id: string }> }) {
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
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${id}` },
          { label: 'Главы' },
        ]}
        className="mb-4"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen size={22} className="text-indigo-400" />
            Главы
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {list.length} {list.length === 1 ? 'глава' : 'глав'}
            {!isDm && ' · только видимые вам'}
          </p>
        </div>
        {isDm && <CreateChapterButton campaignId={id} />}
      </div>

      <ChaptersList campaignId={id} initialChapters={list} isDm={isDm} />
    </div>
  )
}
