'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useRealtimeMusic } from '@/lib/hooks/use-realtime-music'
import { useT } from '@/lib/i18n'
import type { MusicPlayerState, Track } from '@/lib/types'

interface Props {
  campaignId: string
  initialState: MusicPlayerState | null
  currentTrack: Track | null
}

export function MusicPlayer({ campaignId, initialState, currentTrack }: Props) {
  const t = useT()
  const state = useRealtimeMusic({ campaignId, initialState })
  const audioRef = useRef<HTMLAudioElement>(null)
  const [localVolume, setLocalVolume] = useState(50)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !state) return

    if (state.is_playing && state.current_track_id === currentTrack?.id) {
      if (audio.paused) {
        audio.play().catch(() => {})
      }
    } else {
      audio.pause()
    }

    audio.volume = muted ? 0 : localVolume / 100
  }, [state, currentTrack, localVolume, muted])

  if (!currentTrack || !state || !state.is_playing) return null

  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 shadow-2xl">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--success)]" />
        <span className="max-w-[180px] truncate text-sm text-[var(--text-secondary)]">
          ♪ {currentTrack.name}
        </span>
      </div>

      <button
        onClick={() => setMuted(!muted)}
        className="rounded p-1 transition hover:bg-[var(--bg-hover)]"
        title={muted ? t('music.unmute') : t('music.mute')}
      >
        {muted ? (
          <VolumeX size={14} className="text-[var(--text-muted)]" />
        ) : (
          <Volume2 size={14} className="text-[var(--text-muted)]" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={localVolume}
        onChange={(e) => setLocalVolume(Number(e.target.value))}
        className="w-20 accent-[var(--accent)]"
      />

      <audio ref={audioRef} src={currentTrack.audio_url} loop preload="auto" />
    </div>
  )
}
