'use server'

import { createClient } from '@/lib/supabase/server'

const DEV_URL = 'https://yoondivyeueyrtgeldja.supabase.co'
const CAMPAIGN_ID = 'd3f8b097-f6ea-41ba-bc4b-90880c5d1c81'
const SCENE_ID = '430826ee-b43e-4b03-beb7-674e84bd59bb'
const TOKEN_ID = '3ac90049-ad67-4452-85cb-8fa6b451941d'

export type HpTestResult = { ok: boolean; message: string }

export async function runDevHpConcurrencyTest(): Promise<HpTestResult> {
  if (process.env.VERCEL_ENV !== 'preview' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !== DEV_URL) {
    return { ok: false, message: 'Тест разрешён только в DEV Preview.' }
  }

  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, message: 'Сначала войдите в тестовый аккаунт.' }

  const { data: campaign } = await db.from('campaigns')
    .select('name, owner_id').eq('id', CAMPAIGN_ID).maybeSingle()
  if (!campaign?.name.startsWith('[ATOMIC-HP-TEST]') || campaign.owner_id !== user.id) {
    return { ok: false, message: 'Тест доступен только владельцу тестовой кампании.' }
  }
  const { data: scene } = await db.from('scenes').select('campaign_id')
    .eq('id', SCENE_ID).maybeSingle()
  const { data: token } = await db.from('tokens')
    .select('campaign_id, scene_id, character_id, hp_current, hp_max')
    .eq('id', TOKEN_ID).maybeSingle()
  if (scene?.campaign_id !== CAMPAIGN_ID || token?.campaign_id !== CAMPAIGN_ID ||
    token?.scene_id !== SCENE_ID || !token.character_id ||
    token.hp_current !== 3 || token.hp_max !== 10) {
    return { ok: false, message: 'Тестовый токен изменён. Ожидается 3/10 HP, ничего не выполнено.' }
  }
  const { data: character } = await db.from('characters')
    .select('campaign_id, data_json').eq('id', token.character_id).maybeSingle()
  const initialHp = (character?.data_json as { hp?: { current?: number; max?: number } } | null)?.hp
  if (character?.campaign_id !== CAMPAIGN_ID || initialHp?.current !== 3 || initialHp?.max !== 10) {
    return { ok: false, message: 'HP связанного персонажа не совпадают с тестовыми. Изменений нет.' }
  }

  const rpc = (amount: number, mode: 'heal' | 'damage') => db.rpc('apply_token_hp_atomic', {
    p_token_id: TOKEN_ID, p_scene_id: SCENE_ID,
    p_amount: amount, p_mode: mode, p_expected_hp: null,
  })
  const results = await Promise.all([rpc(2, 'damage'), rpc(4, 'heal')])
  if (results.some((r) => r.error)) {
    return { ok: false, message: 'Один из RPC завершился ошибкой. Проверьте HP токена и персонажа.' }
  }
  const { data: finalToken } = await db.from('tokens').select('hp_current')
    .eq('id', TOKEN_ID).maybeSingle()
  const { data: finalCharacter } = await db.from('characters').select('data_json')
    .eq('id', token.character_id).maybeSingle()
  const finalHp = (finalCharacter?.data_json as { hp?: { current?: number } } | null)?.hp?.current
  if (finalToken?.hp_current !== 5 || finalHp !== 5) {
    return { ok: false, message: 'Несовпадение! Ожидалось 5/10 HP. Токен: ' +
      String(finalToken?.hp_current) + ', персонаж: ' + String(finalHp) }
  }
  return { ok: true, message: 'Успех! Параллельный урон −2 и лечение +4: токен и персонаж 5/10 HP.' }
}
