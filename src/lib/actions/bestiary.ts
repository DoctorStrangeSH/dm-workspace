'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

/**
 * Добавляет монстра из SRD в кампанию как entity.
 * Создает КОПИЮ в entities, а не ссылку — чтобы можно было редактировать.
 */
export async function addMonsterToCampaign(
  monsterKey: string,
  campaignId: string
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  // Загружаем монстра из SRD
  const { data: srdMonster, error: fetchError } = await supabase
    .from('srd_monsters')
    .select('*')
    .eq('key', monsterKey)
    .single()

  if (fetchError || !srdMonster) {
    return { error: 'Монстр не найден в SRD' }
  }

  const monsterData = srdMonster.data as any

  // Парсим статы из SRD в наш формат
  const dataJson = parseMonsterData(monsterData)

  // Создаем entity
  const { data: entity, error: insertError } = await supabase
    .from('entities')
    .insert({
      campaign_id: campaignId,
      type: 'monster',
      name: srdMonster.name_ru ?? srdMonster.name,
      description: monsterData.desc ?? '',
      data_json: dataJson,
      is_visible_to_players: false,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('addMonsterToCampaign error:', insertError)
    return { error: 'Не удалось добавить монстра' }
  }

  revalidatePath(`/campaign/${campaignId}/entities`)
  revalidatePath(`/campaign/${campaignId}/bestiary`)

  return { success: true, entityId: entity.id }
}

/**
 * Парсит статблок SRD в наш MonsterData.
 */
function parseMonsterData(srd: any): Record<string, unknown> {
  // HP
  const hpMatch = srd.hit_points?.match(/(\d+)/)
  const hp = hpMatch ? parseInt(hpMatch[1], 10) : 0

  // AC
  const ac =
    srd.armor_class?.[0]?.value ?? srd.armor_class ?? 10

  // CR
  const cr = srd.challenge_rating ?? srd.cr ?? '0'

  return {
    ac: typeof ac === 'number' ? ac : 10,
    hp,
    hp_max: hp,
    speed: parseSpeed(srd.speed),
    size: srd.size?.toLowerCase() ?? 'medium',
    type: srd.type?.toLowerCase() ?? 'unknown',
    alignment: srd.alignment ?? '',
    cr: String(cr),
    xp: srd.xp ?? 0,
    abilities: {
      str: srd.strength ?? 10,
      dex: srd.dexterity ?? 10,
      con: srd.constitution ?? 10,
      int: srd.intelligence ?? 10,
      wis: srd.wisdom ?? 10,
      cha: srd.charisma ?? 10,
    },
    resistances: formatList(srd.damage_resistances),
    immunities: formatList(srd.damage_immunities),
    senses: srd.senses ?? '',
    languages: srd.languages ?? '',
    traits: formatActions(srd.special_abilities, srd.traits),
    actions: formatActions(srd.actions),
    legendary_actions: formatActions(srd.legendary_actions),
  }
}

function parseSpeed(speed: any): number {
  if (typeof speed === 'number') return speed
  if (typeof speed === 'string') {
    const match = speed.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 30
  }
  if (typeof speed === 'object' && speed.walk) {
    const match = String(speed.walk).match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 30
  }
  return 30
}

function formatList(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return ''
}

function formatActions(abilities: any, traits: any = []): string {
  const list = [...(abilities ?? []), ...(traits ?? [])]
  if (list.length === 0) return ''

  return list
    .map((a: any) => {
      const name = a.name ?? ''
      const desc = a.desc ?? ''
      return `**${name}.** ${desc}`
    })
    .join('\n\n')
}