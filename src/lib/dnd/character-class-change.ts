import type { CharacterData } from '@/lib/types'
import { isCanonicalCharacterClass, isSubclassForClass } from './srd-class-utils'

/** Changing class identity must not silently recalculate any other character fields. */
export function changeCharacterClass(
  data: CharacterData,
  newClass: string,
  newSubclass?: string
): CharacterData {
  if (!isCanonicalCharacterClass(newClass)) throw Error('Invalid base class')
  if (newSubclass && !isSubclassForClass(newSubclass, newClass)) {
    throw Error('Subclass does not belong to selected base class')
  }
  const next = { ...data, class: newClass }
  if (newSubclass) next.subclass = newSubclass
  else delete next.subclass
  return next
}
