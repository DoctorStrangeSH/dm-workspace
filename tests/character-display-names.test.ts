import assert from 'node:assert/strict'
import { test } from 'node:test'
import { characterClassName, characterSpeciesName } from '../src/lib/dnd/character-display-names'

test('canonical and SRD 2024 keys show the same Russian class', () => {
  assert.equal(characterClassName('fighter'), 'Воин')
  assert.equal(characterClassName('srd-2024_fighter'), 'Воин')
  assert.equal(characterClassName('srd-2024_paladin'), 'Паладин')
})

test('species names display without SRD technical identifiers', () => {
  assert.equal(characterSpeciesName('human'), 'Человек')
  assert.equal(characterSpeciesName('srd-2024_human'), 'Человек')
  assert.equal(characterSpeciesName('srd-2024_elf'), 'Эльф')
})

test('unknown entries do not silently invent a different class or race', () => {
  assert.equal(characterClassName('unknown-class'), 'unknown-class')
  assert.equal(characterSpeciesName('unknown-species'), 'unknown-species')
})

test('SRD 2024 species and both interface languages have complete display labels', () => {
  assert.equal(characterSpeciesName('srd-2024_goliath'), 'Голиаф')
  assert.equal(characterSpeciesName('srd-2024_orc'), 'Орк')
  assert.equal(characterSpeciesName('srd-2024_aasimar'), 'Аасимар')
  assert.equal(characterClassName('srd-2024_fighter', 'en'), 'Fighter')
  assert.equal(characterSpeciesName('srd-2024_goliath', 'en'), 'Goliath')
  assert.equal(characterClassName('srd-2024_fighter', 'ru', 'Fighter'), 'Воин')
  assert.equal(characterSpeciesName('custom', 'ru', 'Домашняя раса'), 'Домашняя раса')
  assert.equal(characterClassName('custom', 'en', 'Homebrew'), 'Homebrew')
})
