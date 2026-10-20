'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function createPlaylist(campaignId: string, name: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Введите название' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('playlists')
    .insert({ campaign_id: campaignId, name: trimmed })
    .select('id')
    .single()

  if (error) return { error: 'Не удалось создать' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true, playlistId: data.id }
}

export async function deletePlaylist(playlistId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('campaign_id', campaignId)

  if (error) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function addTrack(playlistId: string, campaignId: string, formData: FormData) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const file = formData.get('audio') as File | null
  const name = (formData.get('name') as string)?.trim()

  if (!file) return { error: 'Выберите аудиофайл' }
  if (!name) return { error: 'Введите название' }
  if (file.size > 20 * 1024 * 1024) return { error: 'Файл > 20 MB' }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'mp3'
  const fileName = `${campaignId}/${playlistId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('music').upload(fileName, file)

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Не удалось загрузить' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('music').getPublicUrl(fileName)

  const { data: lastTrack } = await supabase
    .from('tracks')
    .select('order_index')
    .eq('playlist_id', playlistId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('tracks').insert({
    playlist_id: playlistId,
    campaign_id: campaignId,
    name,
    audio_url: publicUrl,
    order_index: (lastTrack?.order_index ?? -1) + 1,
  })

  if (error) return { error: 'Не удалось добавить трек' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function removeTrack(trackId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId)
    .eq('campaign_id', campaignId)

  if (error) return { error: 'Не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function playTrack(campaignId: string, trackId: string, isPlaying: boolean) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  const { error } = await supabase.from('music_player_state').upsert({
    campaign_id: campaignId,
    current_track_id: trackId,
    is_playing: isPlaying,
    position_seconds: 0,
  })

  if (error) return { error: 'Не удалось воспроизвести' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function stopMusic(campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  const { error } = await supabase.from('music_player_state').upsert({
    campaign_id: campaignId,
    current_track_id: null,
    is_playing: false,
    position_seconds: 0,
  })

  if (error) return { error: 'Не удалось остановить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}
