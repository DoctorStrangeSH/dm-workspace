import { baseClassSlug, isSubclassForClass, isSrdBaseClass } from './srd-class-utils'

/** Prepare a class/subclass-only change; leave HP and every other field untouched. */
export function characterIdentityPatch(
  currentClass: string,
  nextClass: string,
  nextSubclass?: string,
): { class: string; subclass?: string } | null {
  if (!isSrdBaseClass(nextClass)) return null
  const nextBase = baseClassSlug(nextClass)
  if (nextSubclass !== undefined && !isSubclassForClass(nextSubclass, nextBase)) return null
  // Persist the canonical base class, never a subclass ID in the class field.
  return nextSubclass === undefined ? { class: nextBase } : { class: nextBase, subclass: nextSubclass }
}
