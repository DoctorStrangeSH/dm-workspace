'use server'

import { randomUUID } from 'node:crypto'
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
  if (typeof spellKey !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,119}$/i.test(spellKey)) return { error: 'Некорректное заклинание' }
  if (typeof characterId !== 'string' || !characterId || typeof campaignId !== 'string' || !campaignId) return { error: 'Некорректные данные персонажа' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { isDm } = await getCampaignAccess(campaignId)

  // Загружаем заклинание
  const { data: srdSpell, error: spellError } = await supabase
    .from('srd_spells')
    .select('*')
    .eq('key', spellKey)
    .maybeSingle()

  if (spellError) return { error: 'Не удалось загрузить заклинание' }
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

  const charData = (character.data_json && typeof character.data_json === 'object' && !Array.isArray(character.data_json) ? character.data_json : {}) as CharacterData
  const spells = Array.isArray(charData.spells) ? charData.spells : []
  if (spells.length >= 300) return { error: 'Список заклинаний достиг лимита' }
  const parsed = parseSpellForDisplay(srdSpell.data)

  const newSpell: CharacterSpell = {
    id: `spell-${randomUUID()}`,
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
    spells: [...spells, newSpell],
  }

  const { data, error } = await supabase
    .from('characters')
    .update({ data_json: newData })
    .eq('id', characterId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('addSrdSpellToCharacter error:', error)
    return { error: 'Не удалось добавить' }
  }

  revalidatePath(`/campaign/${campaignId}/characters/${characterId}`)
  return { success: true }
}
