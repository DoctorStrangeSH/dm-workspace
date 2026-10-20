import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import {
  fetchSpells2024,
  fetchCreatures2024,
  fetchItems2024,
  fetchSpecies2024,
  fetchClasses2024,
  fetchBackgrounds2024,
} from '../src/lib/srd/open5e'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Проверь .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const BATCH_SIZE = 500

function makeKey(item: any): string {
  return item.key ?? item.slug ?? item.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

// ============================================================
// SPELLS
// ============================================================

const CASTING_TIME_MAP: Record<string, string> = {
  action: '1 действие',
  'bonus action': '1 бонусное действие',
  'bonus_action': '1 бонусное действие',
  reaction: '1 реакция',
  minute: '1 минута',
  hour: '1 час',
}

function transformSpell(spell: any): any {
  // Components
  const parts: string[] = []
  if (spell.verbal) parts.push('V')
  if (spell.somatic) parts.push('S')
  if (spell.material) {
    parts.push(
      spell.material_specified
        ? `M (${spell.material_specified})`
        : 'M'
    )
  }
  const components = parts.join(', ')

  return {
    name: spell.name,
    level: Number(spell.level) || 0,
    school: spell.school?.name ?? '',
    castingTime:
      CASTING_TIME_MAP[String(spell.casting_time).toLowerCase()] ??
      spell.casting_time ??
      '',
    range: spell.range_text ?? String(spell.range ?? ''),
    components,
    duration: spell.duration ?? '',
    description: spell.desc ?? '',
    higherLevel: spell.higher_level ?? '',
    classes: (spell.classes ?? []).map((c: any) =>
      typeof c === 'string' ? c : c.name
    ),
    ritual: Boolean(spell.ritual),
    concentration: Boolean(spell.concentration),
  }
}

// ============================================================
// CREATURES
// ============================================================

function transformCreature(creature: any): any {
  // Abilities: из ability_scores
  const scores = creature.ability_scores ?? {}
  const abilities = {
    str: scores.strength ?? 10,
    dex: scores.dexterity ?? 10,
    con: scores.constitution ?? 10,
    int: scores.intelligence ?? 10,
    wis: scores.wisdom ?? 10,
    cha: scores.charisma ?? 10,
  }

  // Speed
  let speed = 30
  if (creature.speed) {
    if (typeof creature.speed === 'number') {
      speed = creature.speed
    } else if (typeof creature.speed === 'object') {
      const walk = creature.speed.walk
      speed = typeof walk === 'number' ? walk : parseInt(String(walk ?? '30').replace(/\D/g, ''), 10) || 30
    }
  }

  // CR
  const cr = creature.challenge_rating ?? creature.cr ?? '0'

  return {
    name: creature.name,
    ac: creature.armor_class ?? 10,
    hp: creature.hit_points ?? 0,
    hp_max: creature.hit_points ?? 0,
    speed,
    size: creature.size?.name?.toLowerCase() ?? 'medium',
    type: creature.type?.name?.toLowerCase() ?? 'unknown',
    alignment: creature.alignment ?? '',
    cr: String(cr),
    xp: creature.experience_points ?? 0,
    abilities,
    resistances:
      creature.resistances_and_immunities?.damage_resistances_display ?? '',
    immunities:
      creature.resistances_and_immunities?.damage_immunities_display ?? '',
    senses: creature.languages?.as_string ?? '',
    languages: creature.languages?.as_string ?? '',
    traits: (creature.traits ?? [])
      .map((t: any) => `**${t.name}.** ${t.desc}`)
      .join('\n\n'),
    actions: (creature.actions ?? [])
      .filter((a: any) => a.action_type !== 'LEGENDARY_ACTION')
      .map((a: any) => `**${a.name}.** ${a.desc}`)
      .join('\n\n'),
    legendary_actions: (creature.actions ?? [])
      .filter((a: any) => a.action_type === 'LEGENDARY_ACTION')
      .map((a: any) => `**${a.name}.** ${a.desc}`)
      .join('\n\n'),
  }
}

// ============================================================
// ITEMS / SPECIES / CLASSES / BACKGROUNDS
// ============================================================

function transformItem(item: any): any {
  return {
    name: item.name,
    item_type: item.category?.name ?? '',
    rarity: item.rarity?.name ?? 'common',
    cost: item.cost ? `${item.cost} ${item.currency ?? 'gp'}` : '',
    weight: String(item.weight ?? ''),
    description: Array.isArray(item.desc) ? item.desc.join('\n\n') : (item.desc ?? ''),
    attunement: Boolean(item.requires_attunement),
  }
}

function transformSpecies(species: any): any {
  return {
    name: species.name,
    speed: species.speed ?? 30,
    size: species.size?.name ?? 'Medium',
    traits: (species.traits ?? [])
      .map((t: any) => `**${t.name}.** ${t.desc}`)
      .join('\n\n'),
  }
}

function transformClass(cls: any): any {
  return {
    name: cls.name,
    hit_die: cls.hit_dice ?? cls.hit_die ?? 8,
    saving_throws: (cls.saving_throws ?? []).map((s: any) =>
      typeof s === 'string' ? s : s.name
    ),
    primary_ability: cls.primary_ability,
  }
}

function transformBackground(bg: any): any {
  return {
    name: bg.name,
    skills: (bg.skill_proficiencies ?? []).map((s: any) =>
      typeof s === 'string' ? s : s.name
    ),
  }
}

// ============================================================
// seedTable
// ============================================================

async function seedTable(
  table: string,
  items: any[],
  transform?: (item: any) => any
) {
  console.log(`\n📦 ${table}: ${items.length} записей`)
  if (items.length === 0) return

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)

    const rows = batch.map((item) => ({
      key: makeKey(item),
      name: item.name ?? 'Unknown',
      name_ru: null,
      data: transform ? transform(item) : item,
    }))

    const { error } = await supabase
      .from(table)
      .upsert(rows, { onConflict: 'key' })

    if (error) {
      console.error(`  ❌ batch ${i}: ${error.message}`)
      continue
    }
    console.log(`  ✅ ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`)
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('🚀 Импорт SRD 2024 из Open5e...\n')

  console.log('📥 Species...')
  await seedTable('srd_species', await fetchSpecies2024(), transformSpecies)

  console.log('\n📥 Classes...')
  await seedTable('srd_classes', await fetchClasses2024(), transformClass)

  console.log('\n📥 Backgrounds...')
  await seedTable('srd_backgrounds', await fetchBackgrounds2024(), transformBackground)

  console.log('\n📥 Creatures...')
  await seedTable('srd_monsters', await fetchCreatures2024(), transformCreature)

  console.log('\n📥 Spells...')
  await seedTable('srd_spells', await fetchSpells2024(), transformSpell)

  console.log('\n📥 Items...')
  await seedTable('srd_items', await fetchItems2024(), transformItem)

  console.log('\n🎉 Импорт завершен!')
}

main().catch((e) => {
  console.error('❌ Ошибка:', e)
  process.exit(1)
})