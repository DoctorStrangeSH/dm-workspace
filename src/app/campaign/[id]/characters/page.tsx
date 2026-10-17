export const instant = false

import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCampaignAccess } from '@/lib/queries/access'
import { getCampaignCharacters } from '@/lib/queries/characters'
import { Breadcrumbs } from '@/components/breadcrumbs'
import EmptyState from '@/components/empty-state'
import CreateCharacterButton from './create-character-button'
import { Sword } from 'lucide-react'

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id: campaignId } = await params
  const { campaign, isDm, isMember } = await getCampaignAccess(campaignId)

  if (!campaign) notFound()
  if (!isMember) redirect('/dashboard')

  const characters = await getCampaignCharacters(campaignId)

  return (
    <div className="max-w-5xl">
      <Breadcrumbs
        items={[
          { label: 'Дашборд', href: '/dashboard' },
          { label: campaign.name, href: `/campaign/${campaignId}` },
          { label: 'Персонажи' },
        ]}
        className="mb-4"
      />

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sword size={22} className="text-amber-400" />
            Персонажи
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {characters.length}{' '}
            {characters.length === 1 ? 'персонаж' : 'персонажей'}
          </p>
        </div>
        <CreateCharacterButton campaignId={campaignId} />
      </div>

      {characters.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title="Пока нет персонажей"
          description={
            isDm
              ? 'Игроки ещё не создали персонажей. Или создай персонажа для себя.'
              : 'Создай своего первого персонажа, чтобы начать играть.'
          }
          size="lg"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Link
              key={char.id}
              href={`/campaign/${campaignId}/characters/${char.id}`}
              className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition block"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-amber-950/40 border border-amber-900/50 flex items-center justify-center text-xl">
                  ⚔️
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-amber-400 transition">
                    {char.name}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {char.data_json.race && (
                      <span className="capitalize">{char.data_json.race}</span>
                    )}
                    {char.data_json.race && char.data_json.class && ' · '}
                    {char.data_json.class && (
                      <span className="capitalize">{char.data_json.class}</span>
                    )}
                    {' · '}
                    <span>Уровень {char.data_json.level ?? 1}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Владелец: {char.owner.display_name ?? char.owner.username}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}