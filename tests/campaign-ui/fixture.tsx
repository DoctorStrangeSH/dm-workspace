import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { I18nProvider, useI18n } from '../../src/lib/i18n'
import { ToastProvider } from '../../src/components/toast/toast-provider'
import { DmScreenProvider } from '../../src/app/campaign/[id]/dm-screen/dm-screen-context'
import { CampaignShell, CampaignTools } from '../../src/app/campaign/[id]/campaign-tools'
import DmScreen from '../../src/app/campaign/[id]/dm-screen/dm-screen'
import ChatPanel from '../../src/app/campaign/[id]/chat/chat-panel'
import { SessionModeLayout } from '../../src/app/campaign/[id]/session/session-mode-layout'
import { SessionChatPanel } from '../../src/app/campaign/[id]/session/session-chat-panel'
import WizardStep1 from '../../src/app/campaign/[id]/characters/new/wizard-step-1'
import { characterClassName, characterSpeciesName } from '../../src/lib/dnd/character-display-names'
import './mocks'

const query = new URLSearchParams(location.search)
document.cookie = `dm-lang=${query.get('lang') === 'en' ? 'en' : 'ru'}; path=/`
document.documentElement.dataset.theme = query.get('theme') === 'light' ? 'light' : 'dark'

function Fixture() {
  const { lang } = useI18n()
  const [race, setRace] = useState('srd-2024_goliath')
  const [cls, setClass] = useState('srd-2024_fighter')
  const [subclass, setSubclass] = useState('')
  const isDm = query.get('role') !== 'player'
  const session = location.pathname.includes('session')
  return (
    <DmScreenProvider>
      <CampaignShell>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
          <div>
            <p className="text-xs tracking-widest text-[var(--accent-text)] uppercase">
              DM Workspace
            </p>
            <h1 className="mt-1 text-xl font-bold">Пепел и звёзды</h1>
          </div>
          <CampaignTools isDm={isDm} />
        </header>
        <main data-testid="workspace-main" className="p-4 sm:p-8">
          {session ? (
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
        <ChatPanel campaignId="test" initialMessages={[]} currentUserId="self" isDm={isDm} />
        {isDm && <DmScreen entities={[]} campaignId="test" />}
      </CampaignShell>
    </DmScreenProvider>
  )
}
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <ToastProvider>
      <Fixture />
    </ToastProvider>
  </I18nProvider>
)
