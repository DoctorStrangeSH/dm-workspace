export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { BookOpen } from 'lucide-react'
import CreateChapterButton from './create-chapter-button'
import ChaptersList from './chapters-list'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { getLang } from '@/lib/i18n/get-lang'
import { createT, getDictionary } from '@/lib/i18n/dictionaries'
import { pluralize } from '@/lib/i18n/plural'
import type { Chapter } from '@/lib/types'

export default async function ChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const lang = await getLang()
  const t = createT(getDictionary(lang))

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
  const countLabel = pluralize(lang, list.length, {
    one: t('chapters.count.one'),
    few: t('chapters.count.few'),
    many: t('chapters.count.many'),
  })

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${id}` },
          { label: t('nav.chapters') },
        ]}
        className="mb-4"
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
            <BookOpen size={22} className="text-[var(--accent-text)]" />
            {t('nav.chapters')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {list.length} {countLabel}
            {!isDm && ` · ${t('chapters.visibleToYou')}`}
          </p>
        </div>
        {isDm && <CreateChapterButton campaignId={id} />}
      </div>

      <ChaptersList campaignId={id} initialChapters={list} isDm={isDm} />
    </div>
  )
}
