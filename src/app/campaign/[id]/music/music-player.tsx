'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useRealtimeMusic } from '@/lib/hooks/use-realtime-music'
import type { MusicPlayerState, Track } from '@/lib/types'

interface Props {
  campaignId: string
  initialState: MusicPlayerState | null
  currentTrack: Track | null
}

export function MusicPlayer({
  campaignId,
  initialState,
  currentTrack,
}: Props) {
  const state = useRealtimeMusic({ campaignId, initialState })
  const audioRef = useRef<HTMLAudioElement>(null)
  const [localVolume, setLocalVolume] = useState(50)
  const [muted, setMuted] = useState(false)

  // Применяем состояние к <audio>
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
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-3 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm text-slate-200 truncate max-w-[180px]">
          ♪ {currentTrack.name}
        </span>
      </div>

      <button
        onClick={() => setMuted(!muted)}
        className="p-1 hover:bg-slate-800 rounded transition"
        title={muted ? 'Включить звук' : 'Выключить звук'}
      >
        {muted ? (
          <VolumeX size={14} className="text-slate-400" />
        ) : (
          <Volume2 size={14} className="text-slate-400" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={localVolume}
        onChange={(e) => setLocalVolume(Number(e.target.value))}
        className="w-20 accent-indigo-500"
      />

      <audio
        ref={audioRef}
        src={currentTrack.audio_url}
        loop
        preload="auto"
      />
    </div>
  )
}