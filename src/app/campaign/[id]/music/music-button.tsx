'use client'

import { useState } from 'react'
import { Music } from 'lucide-react'
import MusicPanel from './music-panel'
import { useT } from '@/lib/i18n'
import type { PlaylistWithTracks } from '@/lib/queries/music'
import type { MusicPlayerState } from '@/lib/types'

interface Props {
  campaignId: string
  playlists: PlaylistWithTracks[]
  playerState: MusicPlayerState | null
}

export default function MusicButton({ campaignId, playlists, playerState }: Props) {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
        aria-label={t('music.open')}
        title={t('music.open')}
      >
        <Music size={17} aria-hidden="true" />
        <span className="hidden xl:inline">{t('music.open')}</span>
      </button>
      {open && (
        <MusicPanel
          campaignId={campaignId}
          playlists={playlists}
          playerState={playerState}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
