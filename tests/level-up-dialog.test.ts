import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mock, test } from 'node:test'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { createEmptyCharacterData, type Character, type CharacterData } from '../src/lib/types'
import * as level from '../src/lib/dnd/level-up'
import * as hp from '../src/lib/dnd/character-hp'
import * as formulas from '../src/lib/dnd/formulas'
import * as constants from '../src/lib/dnd/constants'
import { en } from '../src/lib/i18n/en'

const source = ts.transpileModule(
  readFileSync(
    new URL(
      '../src/app/campaign/[id]/characters/[characterId]/level-up-dialog.tsx',
      import.meta.url
    ),
    'utf8'
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }
).outputText
const noSideEffect = () => {
  throw Error('Rendering must not submit or navigate')
}
const imports: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': jsx,
  'next/navigation': { useRouter: () => ({ refresh: noSideEffect }) },
  'lucide-react': {
    X: () => null,
    TrendingUp: () => null,
    Dices: () => null,
    Sparkles: () => null,
  },
  '@/lib/actions/characters': { levelUp: noSideEffect },
  '@/components/toast/toast-provider': {
    useToast: () => ({ error: noSideEffect, success: noSideEffect }),
  },
  '@/lib/dnd/level-up': level,
  '@/lib/dnd/character-hp': hp,
  '@/lib/dnd/formulas': formulas,
  '@/lib/dnd/constants': constants,
  '@/lib/i18n': {
    useI18n: () => ({
      lang: 'en',
      t: (key: keyof typeof en, params?: Record<string, unknown>) => {
        let text: string = en[key] ?? key
        for (const [name, value] of Object.entries(params ?? {}))
          text = text.replaceAll(`{${name}}`, String(value))
        return text
      },
    }),
  },
  '@/lib/i18n/labels': { abilityLabel: (_lang: string, ability: string) => ability },
  '@/lib/utils': { cn: (...values: unknown[]) => values.filter(Boolean).join(' ') },
}
const exports: Record<string, unknown> = {}
new Function('require', 'exports', source)((name: string) => {
  assert.ok(name in imports, `unexpected dependency: ${name}`)
  return imports[name]
}, exports)
const Dialog = exports.default as React.ComponentType<{
  character: Character
  campaignId: string
  onClose: () => void
}>
const character = (data: unknown) => ({ id: 'character', data_json: data }) as Character
const data = (): CharacterData => ({ ...createEmptyCharacterData(), class: 'fighter' })
const render = (value: unknown) =>
  renderToStaticMarkup(
    React.createElement(Dialog, {
      character: character(value),
      campaignId: 'campaign',
      onClose: noSideEffect,
    })
  )

test('rendering never draws a random preview; average and roll range are stable', () => {
  const random = mock.method(Math, 'random', () => {
    throw Error('UI must not roll')
  })
  try {
    const first = render(data())
    assert.equal(first, render(data()))
    assert.ok(first.includes('+1–10'))
    assert.ok(first.includes('10 → 16'))
    assert.ok(!first.includes('NaN'))
  } finally {
    random.mock.restore()
  }
})

test('score 19 is disabled in +2 mode while score 18 is selectable', () => {
  const value = data()
  value.level = 3
  value.abilities.str = 19
  value.abilities.dex = 18
  const html = render(value)
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
  assert.ok(buttons.find((b) => b[2].includes('>str</span>'))?.[1].includes('disabled'))
  assert.equal(buttons.find((b) => b[2].includes('>dex</span>'))?.[1].includes('disabled'), false)
})

test('malformed saved data renders an actionable alert rather than calculating or crashing', () => {
  for (const invalid of [
    null,
    { ...data(), level: 1.5 },
    { ...data(), class: '' },
    { ...data(), hp: null },
    { ...data(), abilities: null },
  ]) {
    const html = render(invalid)
    assert.ok(html.includes('role="alert"'))
    assert.ok(!html.includes('NaN'))
    assert.ok(!html.includes('Level up to'))
  }
})
