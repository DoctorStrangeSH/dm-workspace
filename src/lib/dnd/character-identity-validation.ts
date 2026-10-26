import { isCanonicalCharacterClass, isSubclassForClass } from './srd-class-utils'

type CharacterIdentity = { class?: unknown; subclass?: unknown }

/** Unchanged legacy values may be preserved, but new class/subclass pairs must be valid. */
export function validateCharacterIdentityUpdate(
  previous: CharacterIdentity,
  next: CharacterIdentity
): string | null {
  const classChanged = previous.class !== next.class
  const subclassChanged = previous.subclass !== next.subclass

  if (classChanged && !isCanonicalCharacterClass(next.class)) {
    return 'Выберите основной класс персонажа, а не подкласс'
  }

  // An old bad pair may survive unrelated changes, but a class edit must not
  // silently carry forward a subclass belonging to another base class.
  if ((classChanged || subclassChanged) && next.subclass !== undefined &&
      !isSubclassForClass(next.subclass, next.class)) {
    return 'Подкласс не соответствует выбранному классу'
  }

  return null
}
