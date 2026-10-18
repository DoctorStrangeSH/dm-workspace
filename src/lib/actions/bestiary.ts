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

  // ВАЖНО: в srd_monsters поле data — это JSONB (объект), а не строка.
  // Но на всякий случай поддержим и строку.
  const monsterData: any =
    typeof srdMonster.data === 'string'
      ? JSON.parse(srdMonster.data)
      : srdMonster.data ?? {}

  const dataJson = parseMonsterData(monsterData)

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
 * Извлекает числовой HP из значения Open5e.
 * Поддерживает:
 *  - число: 135
 *  - строку с числом: "135"
 *  - строку с формулой: "135 (18d8+54)"
 *  - строку-формулу: "18d8+54" (тогда — среднее)
 *  - объект вида { average: 135, formula: "18d8+54" }
 */
function extractHP(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value)

  if (typeof value === 'string') {
    // "135 (18d8+54)" → берём первое число
    const firstNum = value.match(/^\s*(\d+)/)
    if (firstNum) return parseInt(firstNum[1], 10)

    // Чистая формула "18d8+54" → среднее
    const dice = value.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
    if (dice) {
      const [, n, d, mod] = dice
      return Math.floor(Number(n) * (Number(d) + 1) / 2) + Number(mod ?? 0)
    }
  }

  if (value && typeof value === 'object') {
    const v = value as any
    if (typeof v.average === 'number') return v.average
    if (typeof v.value === 'number') return v.value
    if (typeof v.hit_points === 'number') return v.hit_points
  }

  return 0
}

/**
 * Парсит статблок SRD в наш MonsterData.
 */
function parseMonsterData(srd: any): Record<string, unknown> {
  // HP: Open5e v2 может отдавать число ИЛИ строку "135 (18d8+54)"
  const hp = extractHP(srd.hit_points ?? srd.hp ?? srd.hit_points_roll ?? 0)

  // AC: может быть числом или массивом [{ value: 17, type: "natural armor" }]
  const ac =
    typeof srd.armor_class === 'number'
      ? srd.armor_class
      : srd.armor_class?.[0]?.value ?? 10

  const cr = srd.challenge_rating ?? srd.cr ?? '0'

  // Скорость: Open5e v2 отдаёт { walk: 30, fly: 60 } или "30 ft."
  const speed = parseSpeed(srd.speed)

  return {
    ac: typeof ac === 'number' ? ac : 10,
    hp,
    hp_max: hp,
    speed,
    size: srd.size?.toLowerCase?.() ?? srd.size ?? 'medium',
    type: srd.type?.toLowerCase?.() ?? srd.type ?? 'unknown',
    alignment: srd.alignment ?? '',
    cr: String(cr),
    xp: srd.xp ?? srd.experience_points ?? 0,
    abilities: {
      str: srd.strength ?? srd.abilities?.str ?? 10,
      dex: srd.dexterity ?? srd.abilities?.dex ?? 10,
      con: srd.constitution ?? srd.abilities?.con ?? 10,
      int: srd.intelligence ?? srd.abilities?.int ?? 10,
      wis: srd.wisdom ?? srd.abilities?.wis ?? 10,
      cha: srd.charisma ?? srd.abilities?.cha ?? 10,
    },
    resistances: formatList(srd.damage_resistances ?? srd.resistances),
    immunities: formatList(srd.damage_immunities ?? srd.immunities),
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
  if (speed && typeof speed === 'object') {
    // Open5e v2: { walk: 30, fly: 60, ... } — берём walk
    const walk = speed.walk ?? speed.value ?? 30
    const match = String(walk).match(/(\d+)/)
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