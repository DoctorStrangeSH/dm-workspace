'use client'

import { useState } from 'react'
import { Music } from 'lucide-react'
import MusicPanel from './music-panel'
import type {
  PlaylistWithTracks,
  MusicPlayerState,
} from '@/lib/queries/music'

interface Props {
  campaignId: string
  playlists: PlaylistWithTracks[]
  playerState: MusicPlayerState | null
}

export default function MusicButton({
  campaignId,
  playlists,
  playerState,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-slate-800 rounded-lg transition"
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