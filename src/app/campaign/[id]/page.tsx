export const instant = false

import { connection } from 'next/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { BookOpen, Users, MapPin, Package, Skull, Crown } from 'lucide-react'

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const { campaign, isDm } = await getCampaignAccess(id)

  if (!campaign) notFound()

  const supabase = await createClient()

  // Считаем статистику по кампании
  const [chaptersRes, entitiesRes] = await Promise.all([
    supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id),
    supabase
      .from('entities')
      .select('type', { count: 'exact', head: false })
      .eq('campaign_id', id),
  ])

  const chaptersCount = chaptersRes.count ?? 0
  const entities = entitiesRes.data ?? []
  const entitiesCount = entities.length

  const byType = entities.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
        {campaign.genre && (
          <span className="text-xs px-2 py-1 bg-indigo-950/60 border border-indigo-900/50 text-indigo-300 rounded-full">
            {campaign.genre}
          </span>
        )}
        {campaign.description && (
          <p className="text-slate-400 mt-4">{campaign.description}</p>
        )}
      </div>

      {isDm && (
        <div className="mb-6 flex items-center gap-2 text-sm text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2">
          <Crown size={14} />
          <span>Ты — ГМ этой кампании</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Link
          href={`/campaign/${id}/chapters`}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition"
        >
          <BookOpen size={20} className="text-indigo-400 mb-2" />
          <div className="text-2xl font-bold">{chaptersCount}</div>
          <div className="text-sm text-slate-400">Глав</div>
        </Link>

        <Link
          href={`/campaign/${id}/entities`}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition"
        >
          <Users size={20} className="text-emerald-400 mb-2" />
          <div className="text-2xl font-bold">{entitiesCount}</div>
          <div className="text-sm text-slate-400">Сущностей</div>
        </Link>
      </div>

      {entitiesCount > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Сущности по типу</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {byType.npc !== undefined && (
              <Link
                href={`/campaign/${id}/npcs`}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-4 py-3 transition"
              >
                <Users size={16} className="text-indigo-400" />
                <div>
                  <div className="font-semibold">{byType.npc}</div>
                  <div className="text-xs text-slate-400">NPC</div>
                </div>
              </Link>
            )}

            {byType.location !== undefined && (
              <Link
                href={`/campaign/${id}/locations`}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-4 py-3 transition"
              >
                <MapPin size={16} className="text-emerald-400" />
                <div>
                  <div className="font-semibold">{byType.location}</div>
                  <div className="text-xs text-slate-400">Локации</div>
                </div>
              </Link>
            )}

            {byType.item !== undefined && (
              <Link
                href={`/campaign/${id}/items`}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-4 py-3 transition"
              >
                <Package size={16} className="text-amber-400" />
                <div>
                  <div className="font-semibold">{byType.item}</div>
                  <div className="text-xs text-slate-400">Предметы</div>
                </div>
              </Link>
            )}

            {byType.monster !== undefined && (
              <Link
                href={`/campaign/${id}/monsters`}
                className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-4 py-3 transition"
              >
                <Skull size={16} className="text-red-400" />
                <div>
                  <div className="font-semibold">{byType.monster}</div>
                  <div className="text-xs text-slate-400">Монстры</div>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {chaptersCount === 0 && entitiesCount === 0 && (
        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-slate-400 mb-2">Кампания пока пустая</p>
          <p className="text-slate-500 text-sm">
            {isDm
              ? 'Начни с создания первой главы или сущности.'
              : 'ГМ пока не добавил материалы.'}
          </p>
        </div>
      )}
    </div>
  )
}