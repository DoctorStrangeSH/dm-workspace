'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function createPlaylist(campaignId: string, name: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (typeof name !== 'string') return { error: 'Некорректное название' }
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 120) return { error: 'Название должно быть от 1 до 120 символов' }

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
  const { data: deleted, error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !deleted) return { error: 'Плейлист не найден или не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function addTrack(playlistId: string, campaignId: string, formData: FormData) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const fileValue = formData.get('audio')
  const nameValue = formData.get('name')
  if (!(fileValue instanceof File) || fileValue.size === 0) return { error: 'Выберите аудиофайл' }
  if (typeof nameValue !== 'string') return { error: 'Введите название' }
  const file = fileValue
  const name = nameValue.trim()
  if (!name || name.length > 150) return { error: 'Название должно быть от 1 до 150 символов' }
  if (file.size > 20 * 1024 * 1024) return { error: 'Файл > 20 MB' }

  const allowedAudioTypes: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/webm': 'webm',
  }
  const ext = allowedAudioTypes[file.type]
  if (!ext) return { error: 'Неподдерживаемый формат аудио' }

  const supabase = await createClient()
  const { data: playlist } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!playlist) return { error: 'Плейлист не найден в этой кампании' }

  const fileName = `${campaignId}/${crypto.randomUUID()}.${ext}`

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

  if (error) {
    await supabase.storage.from('music').remove([fileName])
    return { error: 'Не удалось добавить трек' }
  }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function removeTrack(trackId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data: deleted, error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !deleted) return { error: 'Трек не найден или не удалось удалить' }

  revalidatePath(`/campaign/${campaignId}`)
  return { success: true }
}

export async function playTrack(campaignId: string, trackId: string, isPlaying: boolean) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (typeof isPlaying !== 'boolean' || typeof trackId !== 'string' || !trackId) {
    return { error: 'Некорректные параметры воспроизведения' }
  }

  const supabase = await createClient()
  const { data: track } = await supabase
    .from('tracks')
    .select('id')
    .eq('id', trackId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (!track) return { error: 'Трек не найден в этой кампании' }

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
