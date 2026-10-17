'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'
import { parseSpellForDisplay } from '@/lib/srd/parse-spell'
import type { CharacterData, CharacterSpell } from '@/lib/types'

export async function addSrdSpellToCharacter(
  spellKey: string,
  characterId: string,
  campaignId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)

  // Загружаем заклинание
  const { data: srdSpell } = await supabase
    .from('srd_spells')
    .select('*')
    .eq('key', spellKey)
    .single()

  if (!srdSpell) return { error: 'Заклинание не найдено' }

  // Загружаем персонажа
  const { data: character } = await supabase
    .from('characters')
    .select('user_id, data_json')
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .single()

  if (!character) return { error: 'Персонаж не найден' }

  const isOwner = character.user_id === user.id
  if (!isOwner && !isDm) return { error: 'Нет прав' }

  const charData = character.data_json as CharacterData
  const parsed = parseSpellForDisplay(srdSpell.data)

  const newSpell: CharacterSpell = {
    id: `spell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: srdSpell.name_ru ?? parsed.name,
    level: parsed.level,
    school: parsed.school as any,
    castingTime: parsed.castingTime,
    range: parsed.range,
    components: parsed.components,
    duration: parsed.duration,
    description: parsed.description,
    ritual: parsed.ritual,
  }

  const newData: CharacterData = {
    ...charData,
    spells: [...(charData.spells ?? []), newSpell],
  }

  const { error } = await supabase
    .from('characters')
    .update({ data_json: newData })
    .eq('id', characterId)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('addSrdSpellToCharacter error:', error)
    return { error: 'Не удалось добавить' }
  }

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}