export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { BookOpen, Sparkles } from 'lucide-react'
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

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(120deg,var(--bg-primary),var(--bg-secondary))] p-5 shadow-[var(--shadow-sm)] sm:p-7" aria-labelledby="chapters-heading">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border border-[var(--accent)]/20">
          <div className="absolute inset-9 rounded-full border border-[var(--accent)]/15" />
          <Sparkles size={22} className="absolute bottom-9 left-7 text-[var(--accent)]/30" />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-subtle)] px-3 py-1.5 text-xs text-[var(--accent-text)]">
              <BookOpen size={14} aria-hidden="true" />
              {lang === 'en' ? 'Story archive' : 'Архив приключений'}
            </span>
            <h1 id="chapters-heading" className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {t('nav.chapters')}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {list.length} {countLabel}
              {!isDm && ` · ${t('chapters.visibleToYou')}`}
            </p>
          </div>
          {isDm && <CreateChapterButton campaignId={id} />}
        </div>
      </section>

      <ChaptersList campaignId={id} initialChapters={list} isDm={isDm} />
    </div>
  )
}
