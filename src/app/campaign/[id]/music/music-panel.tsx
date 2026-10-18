'use client'

'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Music,
  Plus,
  X,
  Play,
  Pause,
  Square,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react'
import {
  createPlaylist,
  deletePlaylist,
  addTrack,
  removeTrack,
  playTrack,
  stopMusic,
} from '@/lib/actions/music'
import { useToast } from '@/components/toast/toast-provider'
import type { PlaylistWithTracks } from '@/lib/queries/music'
import type { Track, MusicPlayerState } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  campaignId: string
  playlists: PlaylistWithTracks[]
  playerState: MusicPlayerState | null
  onClose: () => void
}

export default function MusicPanel({
  campaignId,
  playlists,
  playerState,
  onClose,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [uploadingToPlaylist, setUploadingToPlaylist] = useState<string | null>(
    null
  )
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return
    startTransition(async () => {
      const res = await createPlaylist(campaignId, newPlaylistName)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Плейлист создан')
        setNewPlaylistName('')
        router.refresh()
      }
    })
  }

  const handleDeletePlaylist = (playlistId: string, name: string) => {
    if (!confirm(`Удалить плейлист «${name}»?`)) return
    startTransition(async () => {
      const res = await deletePlaylist(playlistId, campaignId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Плейлист удалён')
        router.refresh()
      }
    })
  }

  const handleTrackFileChange = async (
    playlistId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingToPlaylist(playlistId)

    const formData = new FormData()
    formData.append('audio', file)
    formData.append('name', file.name.replace(/\.[^.]+$/, ''))

    const res = await addTrack(playlistId, campaignId, formData)
    setUploadingToPlaylist(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Трек добавлен')
      router.refresh()
    }
    if (fileInputRefs.current[playlistId]) {
      fileInputRefs.current[playlistId]!.value = ''
    }
  }

  const handleRemoveTrack = (trackId: string) => {
    startTransition(async () => {
      const res = await removeTrack(trackId, campaignId)
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  const handlePlay = (track: Track) => {
    const isSame =
      playerState?.current_track_id === track.id && playerState.is_playing
    startTransition(async () => {
      if (isSame) {
        const res = await playTrack(campaignId, track.id, false)
        if (res.error) toast.error(res.error)
        else router.refresh()
      } else {
        const res = await playTrack(campaignId, track.id, true)
        if (res.error) toast.error(res.error)
        else router.refresh()
      }
    })
  }

  const handleStop = () => {
    startTransition(async () => {
      const res = await stopMusic(campaignId)
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  return (
    <aside className="fixed top-0 right-0 z-40 h-screen w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Music size={18} className="text-violet-400" />
          <h2 className="font-semibold">Музыка</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded"
        >
          <X size={18} />
        </button>
      </div>

      {playerState?.is_playing && (
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={handleStop}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition text-sm disabled:opacity-50"
          >
            <Square size={14} />
            Остановить всё
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            placeholder="Новый плейлист..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
          />
          <button
            onClick={handleCreatePlaylist}
            disabled={isPending || !newPlaylistName.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            Нет плейлистов. Создай первый!
          </p>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{playlist.name}</h3>
                  <div className="flex items-center gap-1">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[playlist.id] = el
                      }}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleTrackFileChange(playlist.id, e)}
                      className="hidden"
                    />
                    <button
                      onClick={() =>
                        fileInputRefs.current[playlist.id]?.click()
                      }
                      disabled={uploadingToPlaylist === playlist.id}
                      className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-50"
                      title="Добавить трек"
                    >
                      {uploadingToPlaylist === playlist.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} className="text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleDeletePlaylist(playlist.id, playlist.name)
                      }
                      className="p-1 hover:bg-red-950/40 rounded transition"
                      title="Удалить плейлист"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {playlist.tracks.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-2">
                    Нет треков
                  </p>
                ) : (
                  <div className="space-y-1">
                    {playlist.tracks.map((track) => {
                      const isPlaying =
                        playerState?.current_track_id === track.id &&
                        playerState.is_playing
                      return (
                        <div
                          key={track.id}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded transition',
                            isPlaying && 'bg-violet-950/40'
                          )}
                        >
                          <button
                            onClick={() => handlePlay(track)}
                            disabled={isPending}
                            className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-50"
                          >
                            {isPlaying ? (
                              <Pause size={12} className="text-violet-400" />
                            ) : (
                              <Play size={12} className="text-slate-400" />
                            )}
                          </button>
                          <span
                            className={cn(
                              'flex-1 text-xs truncate',
                              isPlaying ? 'text-violet-300' : 'text-slate-300'
                            )}
                          >
                            {track.name}
                          </span>
                          <button
                            onClick={() => handleRemoveTrack(track.id)}
                            disabled={isPending}
                            className="p-1 hover:bg-red-950/40 rounded transition opacity-50 hover:opacity-100"
                          >
                            <X size={10} className="text-red-400" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}