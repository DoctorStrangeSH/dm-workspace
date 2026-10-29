import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { createEmptyCharacterData } from '../src/lib/types'
import * as hp from '../src/lib/dnd/character-hp'
import * as display from '../src/lib/dnd/character-display-names'
import * as dictionaries from '../src/lib/i18n/dictionaries'
import * as plural from '../src/lib/i18n/plural'

// Render the real server page with read-only query boundaries. No database/session.
const source = ts.transpileModule(
  readFileSync(new URL('../src/app/campaign/[id]/characters/page.tsx', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }
).outputText
async function render(rawHP: unknown, lang: 'ru' | 'en' = 'ru') {
  const data = { ...createEmptyCharacterData(), class: 'sorcerer', hp: rawHP }
  const before = structuredClone(data)
  const imports: Record<string, unknown> = {
    'react/jsx-runtime': jsx,
    'next/server': { connection: async () => {} },
    'next/navigation': {
      notFound: () => {
        throw Error('Unexpected notFound')
      },
      redirect: () => {
        throw Error('Unexpected redirect')
      },
    },
    'next/link': {
      default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
        React.createElement('a', props, children),
    },
    '@/lib/queries/access': {
      getCampaignAccess: async () => ({
        campaign: { id: 'campaign', name: 'Campaign' },
        isDm: true,
        isMember: true,
      }),
    },
    '@/lib/queries/characters': {
      getCampaignCharacters: async () => [
        {
          id: 'hero',
          name: 'Holmes',
          data_json: data,
          owner: { display_name: null, username: 'Owner' },
        },
      ],
    },
    '@/components/breadcrumbs': { Breadcrumbs: () => null },
    '@/components/ui': {
      Card: ({ children }: { children: React.ReactNode }) =>
        React.createElement('article', {}, children),
      EmptyState: () => null,
    },
    './create-character-button': { default: () => null },
    'lucide-react': Object.fromEntries(
      ['Sword', 'ArrowUpRight', 'Shield', 'Heart', 'Sparkles', 'Users'].map((key) => [
        key,
        () => null,
      ])
    ),
    '@/lib/i18n/get-lang': { getLang: async () => lang },
    '@/lib/i18n/dictionaries': dictionaries,
    '@/lib/i18n/plural': plural,
    '@/lib/dnd/character-display-names': display,
    '@/lib/dnd/character-hp': hp,
  }
  const exports: Record<string, unknown> = {}
  new Function('require', 'exports', source)((name: string) => {
    assert.ok(name in imports, 'Unexpected dependency: ' + name)
    return imports[name]
  }, exports)
  const page = exports.default as (props: {
    params: Promise<{ id: string }>
  }) => Promise<React.ReactNode>
  const html = renderToStaticMarkup(await page({ params: Promise.resolve({ id: 'campaign' }) }))
  assert.deepEqual(data, before)
  return html
}

test('character list never renders corrupt HP as a numeric bar or silently invents values', async () => {
  for (const raw of [
    undefined,
    null,
    {},
    { current: 'D62', max: 'D62' },
    { current: {}, max: 8 },
    { current: 9, max: 8 },
    { current: 0 },
    { current: 0, max: 8, temp: -1 },
  ]) {
    const html = await render(raw)
    assert.ok(html.includes('Проверьте HP'))
    assert.ok(!html.includes('D62'))
    assert.ok(!html.includes('role="img"'))
    assert.ok(!html.includes('NaN'))
    assert.ok(!html.includes('width:'))
  }
})

test('character list preserves valid and missing-temp legacy HP and localizes accessible labels', async () => {
  for (const raw of [
    { current: 4, max: 8, temp: 2 },
    { current: 4, max: 8 },
  ]) {
    const html = await render(raw, 'en')
    assert.ok(html.includes('4 / 8'))
    assert.ok(html.includes('width:50%'))
    assert.ok(html.includes('aria-label="HP 4 of 8"'))
    assert.ok(!html.includes('Check HP'))
  }
  assert.ok((await render(null, 'en')).includes('Check HP'))
})
