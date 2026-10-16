export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { getBacklinksCounts } from '@/lib/queries/backlinks'
import { Users } from 'lucide-react'
import CreateEntityButton from './create-entity-button'
import EntityCard from './entity-card'
import { ENTITY_FILTERS } from '@/lib/entity-ui'
import { cn } from '@/lib/utils'
import type { Entity, EntityType } from '@/lib/types'

export default async function EntitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { type: typeFilter } = await searchParams
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const supabase = await createClient()

  let query = supabase
    .from('entities')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false })

  const validTypes: EntityType[] = [
    'npc',
    'location',
    'item',
    'monster',
    'faction',
    'quest',
    'note',
  ]

  if (typeFilter && validTypes.includes(typeFilter as EntityType)) {
    query = query.eq('type', typeFilter)
  }

  const { data, error } = await query
  if (error) console.error('entities query error:', error)

  const entities = (data ?? []) as Entity[]

  // Счётчики упоминаний для всех сущностей кампании
  const backlinksCounts = await getBacklinksCounts(campaignId)

  const activeType = typeFilter ?? 'all'
  const base = `/campaign/${campaignId}/entities`

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={22} className="text-emerald-400" />
            Сущности
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {entities.length}{' '}
            {entities.length === 1 ? 'сущность' : 'сущностей'}
            {!isDm && ' · только видимые вам'}
          </p>
        </div>
        {isDm && <CreateEntityButton campaignId={campaignId} />}
      </div>

      {/* Фильтры по типу */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ENTITY_FILTERS.map((f) => {
          const isActive = activeType === f.value
          const href =
            f.value === 'all' ? base : `${base}?type=${f.value}`
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition',
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              )}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {entities.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Users size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">
            {activeType === 'all'
              ? 'Пока нет ни одной сущности'
              : 'Нет сущностей этого типа'}
          </p>
          <p className="text-slate-500 text-sm">
            {isDm
              ? 'Создай NPC, локацию, монстра или предмет.'
              : 'ГМ пока не добавил материалы.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((e) => (
            <EntityCard
              key={e.id}
              entity={e}
              campaignId={campaignId}
              isDm={isDm}
              backlinksCount={backlinksCounts[e.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}