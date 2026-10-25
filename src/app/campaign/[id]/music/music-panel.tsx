'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Music, Plus, X, Play, Pause, Square, Trash2, Upload, Loader2 } from 'lucide-react'
import {
  createPlaylist,
  deletePlaylist,
  addTrack,
  removeTrack,
  playTrack,
  stopMusic,
} from '@/lib/actions/music'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Dialog, IconButton } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { PlaylistWithTracks } from '@/lib/queries/music'
import type { Track, MusicPlayerState } from '@/lib/types'

interface Props {
  campaignId: string
  playlists: PlaylistWithTracks[]
  playerState: MusicPlayerState | null
  onClose: () => void
}

export default function MusicPanel({ campaignId, playlists, playerState, onClose }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [uploadingToPlaylist, setUploadingToPlaylist] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return
    startTransition(async () => {
      const res = await createPlaylist(campaignId, newPlaylistName)
      if (res.error) toast.error(res.error)
      else {
        toast.success(t('music.toast.playlistCreated'))
        setNewPlaylistName('')
        router.refresh()
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deletePlaylist(deleteTarget.id, campaignId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(t('music.toast.playlistDeleted'))
        setDeleteTarget(null)
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
      toast.success(t('music.toast.trackAdded'))
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
    const isSame = playerState?.current_track_id === track.id && playerState.is_playing
    startTransition(async () => {
      const res = await playTrack(campaignId, track.id, !isSame)
      if (res.error) toast.error(res.error)
      else router.refresh()
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
    <aside className="fixed top-0 right-0 z-40 flex h-screen w-full flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl sm:w-[420px]">
      <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
        <div className="flex items-center gap-2">
          <Music size={18} className="text-[var(--accent-text)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">{t('music.title')}</h2>
        </div>
        <IconButton variant="ghost" size="sm" label={t('common.close')} onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>

      {playerState?.is_playing && (
        <div className="border-b border-[var(--border-default)] p-3">
          <Button
            variant="danger"
            size="sm"
            icon={<Square size={14} />}
            onClick={handleStop}
            disabled={isPending}
            className="w-full"
          >
            {t('music.stopAll')}
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            placeholder={t('music.newPlaylistPlaceholder')}
            className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none"
          />
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={handleCreatePlaylist}
            disabled={isPending || !newPlaylistName.trim()}
          />
        </div>

        {playlists.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">
            {t('music.emptyPlaylists')}
          </p>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    {playlist.name}
                  </h3>
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
                    <IconButton
                      variant="ghost"
                      size="sm"
                      label={t('music.addTrack')}
                      onClick={() => fileInputRefs.current[playlist.id]?.click()}
                      disabled={uploadingToPlaylist === playlist.id}
                    >
                      {uploadingToPlaylist === playlist.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Upload size={12} />
                      )}
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      label={t('music.deletePlaylist')}
                      onClick={() => setDeleteTarget({ id: playlist.id, name: playlist.name })}
                    >
                      <Trash2 size={12} className="text-[var(--danger)]" />
                    </IconButton>
                  </div>
                </div>

                {playlist.tracks.length === 0 ? (
                  <p className="py-2 text-center text-xs text-[var(--text-subtle)]">
                    {t('music.noTracks')}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {playlist.tracks.map((track) => {
                      const isPlaying =
                        playerState?.current_track_id === track.id && playerState.is_playing
                      return (
                        <div
                          key={track.id}
                          className={cn(
                            'flex items-center gap-2 rounded px-2 py-1.5 transition',
                            isPlaying && 'bg-[var(--accent-subtle)]'
                          )}
                        >
                          <IconButton
                            variant="ghost"
                            size="sm"
                            label={isPlaying ? t('music.pause') : t('music.play')}
                            onClick={() => handlePlay(track)}
                            disabled={isPending}
                          >
                            {isPlaying ? (
                              <Pause size={12} className="text-[var(--accent-text)]" />
                            ) : (
                              <Play size={12} />
                            )}
                          </IconButton>
                          <span
                            className={cn(
                              'flex-1 truncate text-xs',
                              isPlaying
                                ? 'text-[var(--accent-text)]'
                                : 'text-[var(--text-secondary)]'
                            )}
                          >
                            {track.name}
                          </span>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            label={t('music.removeTrack')}
                            onClick={() => handleRemoveTrack(track.id)}
                            disabled={isPending}
                            className="opacity-50 hover:opacity-100"
                          >
                            <X size={10} className="text-[var(--danger)]" />
                          </IconButton>
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

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !isPending && setDeleteTarget(null)}
        title={t('music.deleteConfirm.title')}
        description={
          deleteTarget ? t('music.deleteConfirm.description', { name: deleteTarget.name }) : ''
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('music.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </aside>
  )
}
