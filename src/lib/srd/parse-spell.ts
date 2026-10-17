export interface ParsedSpell {
  name: string
  level: number
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  description: string
  higherLevel?: string
  classes: string[]
  ritual: boolean
  concentration: boolean
}

export function parseSpellForDisplay(spellData: any): ParsedSpell {
  const data = spellData ?? {}

  return {
    name: data.name ?? 'Unknown',
    level: Number(data.level) || 0,
    school: data.school ?? '',
    castingTime: data.castingTime ?? '',
    range: data.range ?? '',
    components: data.components ?? '',
    duration: data.duration ?? '',
    description: data.description ?? '',
    higherLevel: data.higherLevel,
    classes: data.classes ?? [],
    ritual: Boolean(data.ritual),
    concentration: Boolean(data.concentration),
  }
}