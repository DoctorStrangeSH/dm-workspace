import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { I18nProvider, useI18n } from '../../src/lib/i18n'
import { ToastProvider } from '../../src/components/toast/toast-provider'
import { DmScreenProvider } from '../../src/app/campaign/[id]/dm-screen/dm-screen-context'
import { CampaignShell } from '../../src/app/campaign/[id]/campaign-tools'
import { CampaignHeader } from '../../src/app/campaign/[id]/campaign-header'
import CampaignSidebar from '../../src/app/campaign/[id]/campaign-sidebar'
import { MobileBottomNav } from '../../src/components/mobile-bottom-nav'
import { LangToggle } from '../../src/components/ui/lang-toggle'
import ThemeToggle from '../../src/components/theme-toggle'
import { ThemeProvider } from '../../src/lib/hooks/use-theme'
import { SessionModeToggle } from '../../src/app/campaign/[id]/session-mode-toggle'
import CampaignOverview from '../../src/app/campaign/[id]/campaign-overview'
import ChapterEditor from '../../src/app/campaign/[id]/chapters/[chapterId]/chapter-editor'
import { overviewStats } from './overview-data'
import DmScreen from '../../src/app/campaign/[id]/dm-screen/dm-screen'
import ChatPanel from '../../src/app/campaign/[id]/chat/chat-panel'
import { SessionModeLayout } from '../../src/app/campaign/[id]/session/session-mode-layout'
import { SessionChatPanel } from '../../src/app/campaign/[id]/session/session-chat-panel'
import WizardStep1 from '../../src/app/campaign/[id]/characters/new/wizard-step-1'
import CharacterSheet from '../../src/app/campaign/[id]/characters/[characterId]/character-sheet'
import { createEmptyCharacterData, type Character } from '../../src/lib/types'
import CharacterWizard from '../../src/app/campaign/[id]/characters/new/character-wizard'
import { characterClassName, characterSpeciesName } from '../../src/lib/dnd/character-display-names'
import './mocks'

const query = new URLSearchParams(location.search)
document.cookie = `dm-lang=${query.get('lang') === 'en' ? 'en' : 'ru'}; path=/`
document.documentElement.dataset.theme = query.get('theme') === 'light' ? 'light' : 'dark'

const hpFixtures: Record<string, unknown> = {
  missing: undefined,
  null: null,
  empty: {},
  string: { current: 'D62', max: 'D62', temp: 0 },
  object: { current: {}, max: 8 },
  partial: { current: 0 },
  over: { current: 9, max: 8 },
  temp: { current: 0, max: 8, temp: -1 },
  valid: { current: 4, max: 8, temp: 2 },
  legacy: { current: 4, max: 8 },
  zero: { current: 0, max: 8 },
}
const fixtureCharacter = {
  id: 'offline-character',
  campaign_id: 'test',
  user_id: 'self',
  name: 'Holmes',
  data_json: {
    ...createEmptyCharacterData(),
    class: query.has('prefixed') ? 'srd-2024_sorcerer' : 'sorcerer',
    ...(query.has('subclass') ? { subclass: 'srd-2024_draconic-sorcery' } : {}),
    race: 'human',
    notes: 'keep this note',
    hp: hpFixtures[query.get('hp') ?? 'string'],
  },
} as Character
Object.assign(window, { __characterFixture: fixtureCharacter })

function Fixture() {
  const { lang } = useI18n()
  const [race, setRace] = useState('srd-2024_goliath')
  const [cls, setClass] = useState('srd-2024_fighter')
  const [subclass, setSubclass] = useState('')
  const isDm = query.get('role') !== 'player'
  const session = location.pathname.includes('session')
  const screen = query.get('screen')
  return (
    <DmScreenProvider>
      <CampaignShell>
        <CampaignHeader
          campaignId="test"
          name="Пепел и звёзды — приключения в забытых королевствах"
          genre="Фэнтези · Dungeons & Dragons"
          isDm={isDm}
          preferences={
            <>
              <LangToggle />
              <ThemeToggle />
            </>
          }
          search={
            <button type="button" aria-label="Search" className="h-11 w-11">
              ⌕
            </button>
          }
          actions={
            <>
              {isDm && (
                <>
                  {['Music', 'Handouts'].map((label) => (
                    <button
                      key={label}
                      aria-label={label}
                      className="h-11 w-11 rounded-xl border border-[var(--border-default)]"
                    >
                      ◇
                    </button>
                  ))}
                  <SessionModeToggle campaignId="test" />
                </>
              )}
              <button
                aria-label="Session log"
                className="h-11 w-11 rounded-xl border border-[var(--border-default)]"
              >
                ≡
              </button>
            </>
          }
          presence={<span className="px-2 text-xs">1 online</span>}
        />
        <div className="flex">
          <CampaignSidebar campaignId="test" isDm={isDm} />
          <main
            data-testid="workspace-main"
            className="min-w-0 flex-1 p-3 pb-24 sm:p-6 sm:pb-24 md:pb-6"
          >
            {screen === 'character-sheet' ? (
              <CharacterSheet
                character={fixtureCharacter}
                campaignId="test"
                campaignName="Пепел и звёзды"
                owner={{ display_name: 'Мира', username: 'Mira' }}
                canEdit={query.get('readonly') !== 'true'}
                isDm={isDm}
              />
            ) : screen === 'character-create' ? (
              <CharacterWizard
                campaignId="test"
                species={
                  query.get('catalog') === 'fallback'
                    ? []
                    : [{ key: 'srd-2024_human', name: 'Human', name_ru: null, data: {} }]
                }
                classes={
                  query.get('catalog') === 'fallback'
                    ? []
                    : [
                        {
                          key: 'srd-2024_sorcerer',
                          name: 'Sorcerer',
                          name_ru: null,
                          data: { hit_die: 'D6' },
                        },
                        {
                          key: 'srd-2024_fighter',
                          name: 'Fighter',
                          name_ru: null,
                          data: { hit_die: 'D10' },
                        },
                      ]
                }
              />
            ) : screen === 'overview' ? (
              <CampaignOverview
                campaign={{
                  id: 'test',
                  name: 'Пепел и звёзды — приключения в забытых королевствах',
                  genre: 'Dungeons & Dragons',
                  description: query.has('long') ? 'Adventure'.repeat(30) : null,
                }}
                isDm={isDm}
                stats={
                  query.get('stats') === 'unavailable' ? null : overviewStats(query.get('stats'))
                }
                activeScene={{ id: 'active', name: 'The abandoned observatory' }}
                lang={lang}
                now={Date.parse('2026-10-29T08:00:00Z')}
              />
            ) : screen === 'editor' ? (
              <ChapterEditor
                campaignId="test"
                chapterId="chapter"
                chapterTitle="The observatory"
                initialContent="The observatory"
                readOnly={query.get('readonly') === 'true'}
              />
            ) : session ? (
              <SessionModeLayout campaignId="test" campaignName="Пепел и звёзды">
                <div className="flex min-h-0 flex-col p-4" data-testid="chapter">
                  Chapter content
                </div>
                <div className="flex min-h-0 flex-col p-4" data-testid="scene">
                  Scene content
                </div>
                <SessionChatPanel
                  campaignId="test"
                  initialMessages={[]}
                  currentUserId="self"
                  isDm={isDm}
                />
              </SessionModeLayout>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[var(--accent-text)] uppercase">
                    Ваша группа
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight">
                    История начинается с героя
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {characterSpeciesName(race, lang)} · {characterClassName(cls, lang)}
                  </p>
                </div>
                <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
                  <WizardStep1
                    name="Элиан"
                    setName={() => {}}
                    raceSlug={race}
                    setRaceSlug={setRace}
                    classSlug={cls}
                    setClassSlug={setClass}
                    subclassSlug={subclass}
                    setSubclassSlug={setSubclass}
                    level={1}
                    setLevel={() => {}}
                    species={['human', 'elf', 'orc', 'goliath'].map((key) => ({
                      key: `srd-2024_${key}`,
                      name: key,
                      name_ru: null,
                      data: {},
                    }))}
                    classes={['fighter', 'wizard', 'paladin'].map((key) => ({
                      key: `srd-2024_${key}`,
                      name: key,
                      name_ru: '',
                      data: {},
                    }))}
                  />
                </section>
              </div>
            )}
          </main>
        </div>
        <MobileBottomNav campaignId="test" />
        <ChatPanel campaignId="test" initialMessages={[]} currentUserId="self" isDm={isDm} />
        {isDm && <DmScreen entities={[]} campaignId="test" />}
      </CampaignShell>
    </DmScreenProvider>
  )
}
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <ThemeProvider initialTheme={query.get('theme') === 'light' ? 'light' : 'dark'}>
      <ToastProvider>
        <Fixture />
      </ToastProvider>
    </ThemeProvider>
  </I18nProvider>
)
