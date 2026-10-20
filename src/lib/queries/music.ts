import { createClient } from '@/lib/supabase/server'
import type { Playlist, Track, MusicPlayerState } from '@/lib/types'

export interface PlaylistWithTracks extends Playlist {
  tracks: Track[]
}

export async function getPlaylists(campaignId: string): Promise<PlaylistWithTracks[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('playlists')
    .select('*, tracks:tracks(*)')
    .eq('campaign_id', campaignId)
    .order('created_at')

  if (error) return []

  return (data ?? []).map((row: any) => ({
    ...row,
    tracks: (row.tracks ?? []).sort((a: Track, b: Track) => a.order_index - b.order_index),
  })) as PlaylistWithTracks[]
}

export async function getMusicState(campaignId: string): Promise<MusicPlayerState | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('music_player_state')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle()

  return data as MusicPlayerState | null
}

export async function getCurrentTrack(campaignId: string): Promise<Track | null> {
  const supabase = await createClient()
  const state = await getMusicState(campaignId)
  if (!state?.current_track_id) return null

  const { data } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', state.current_track_id)
    .single()

  return data as Track | null
}
