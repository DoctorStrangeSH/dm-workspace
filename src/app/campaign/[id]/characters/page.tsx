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

export default async function CharactersPage({ params }: { params: Promise<{ id: string }> }) {
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sword size={22} className="text-amber-400" />
            Персонажи
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {characters.length} {characters.length === 1 ? 'персонаж' : 'персонажей'}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <Link
              key={char.id}
              href={`/campaign/${campaignId}/characters/${char.id}`}
              className="group block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-900/50 bg-amber-950/40 text-xl">
                  ⚔️
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold transition group-hover:text-amber-400">
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
                  <div className="mt-1 text-xs text-slate-500">
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
