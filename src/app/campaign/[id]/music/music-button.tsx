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
        className="rounded-lg p-2 transition hover:bg-[var(--bg-hover)]"
        title={t('music.open')}
      >
        <Music size={16} />
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
