import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SRD_BASE_CLASSES, SRD_SUBCLASS_BASE, isSubclassForClass, subclassDisplayName } from '../src/lib/dnd/srd-class-utils'

test('each supported SRD subclass belongs to exactly one valid base class', () => {
  assert.equal(Object.keys(SRD_SUBCLASS_BASE).length, 12)
  for (const [subclass, baseClass] of Object.entries(SRD_SUBCLASS_BASE)) {
    assert.ok(SRD_BASE_CLASSES.has(baseClass), subclass)
    assert.equal(isSubclassForClass(subclass, baseClass), true, subclass)
    for (const otherClass of SRD_BASE_CLASSES) {
      if (otherClass !== baseClass) assert.equal(isSubclassForClass(subclass, otherClass), false)
    }
    assert.ok(subclassDisplayName(subclass).length > 0)
  }
})

test('unknown and malformed subclass identifiers cannot match a class', () => {
  assert.equal(isSubclassForClass('srd-2024_unknown', 'fighter'), false)
  assert.equal(isSubclassForClass('', 'fighter'), false)
  assert.equal(isSubclassForClass(null, 'fighter'), false)
  assert.equal(isSubclassForClass('srd-2024_champion', 'wizard'), false)
  assert.equal(isSubclassForClass('srd-2024_champion', null), false)
})
