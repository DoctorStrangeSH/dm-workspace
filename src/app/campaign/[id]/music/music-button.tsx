'use client'

import { useState } from 'react'
import { Music } from 'lucide-react'
import MusicPanel from './music-panel'
import type { PlaylistWithTracks } from '@/lib/queries/music'
import type { MusicPlayerState } from '@/lib/types'

interface Props {
  campaignId: string
  playlists: PlaylistWithTracks[]
  playerState: MusicPlayerState | null
}

export default function MusicButton({ campaignId, playlists, playerState }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 transition hover:bg-slate-800"
        title="Музыка"
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
