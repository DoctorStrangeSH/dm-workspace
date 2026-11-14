'use server'

import { createClient } from '@/lib/supabase/server'
import { getCampaignAccess } from '@/lib/queries/access'
import { revalidatePath } from 'next/cache'
import { TOKEN_ART_LIMIT, tokenArtFormat } from '@/lib/maps/token-art'

export async function uploadTokenArt(
  tokenId: string,
  sceneId: string,
  expectedImage: string | null,
  file: File
) {
  if (!(file instanceof File) || file.size === 0 || file.size > TOKEN_ART_LIMIT)
    return { error: 'Выберите PNG, JPG или WebP до 2 МБ' }
  if (expectedImage !== null && typeof expectedImage !== 'string')
    return { error: 'Обновите панель токена' }
  const format = tokenArtFormat(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type)
  if (!format) return { error: 'Формат файла не соответствует PNG, JPG или WebP' }
  const db = await createClient()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return { error: 'Войдите в аккаунт' }
  const { data: token } = await db
    .from('tokens')
    .select('id, scene_id, campaign_id, owner_id, image_url')
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .maybeSingle()
  if (!token) return { error: 'Токен недоступен' }
  const { isMember, isDm } = await getCampaignAccess(token.campaign_id)
  if (!isMember || (!isDm && token.owner_id !== user.id))
    return { error: 'Изображение может менять ведущий или владелец токена' }
  if (token.image_url !== expectedImage)
    return { error: 'Изображение уже изменилось. Обновите панель токена' }
  const path = `${token.campaign_id}/${sceneId}/${tokenId}/${crypto.randomUUID()}.${format}`
  const { error: uploadError } = await db.storage
    .from('token-art')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: 'Не удалось загрузить изображение. Попробуйте ещё раз' }
  let update = db
    .from('tokens')
    .update({ image_url: path })
    .eq('id', tokenId)
    .eq('scene_id', sceneId)
    .eq('campaign_id', token.campaign_id)
  update =
    expectedImage === null ? update.is('image_url', null) : update.eq('image_url', expectedImage)
  const { data: saved, error } = await update.select('id').maybeSingle()
  // Unique immutable uploads are retained on uncertain write outcomes. Never delete potentially referenced art.
  if (error || !saved)
    return { error: 'Не удалось сохранить: токен изменился или недоступен. Обновите панель' }
  revalidatePath(`/campaign/${token.campaign_id}/scenes/${sceneId}`)
  return { success: true, imageUrl: path }
}
