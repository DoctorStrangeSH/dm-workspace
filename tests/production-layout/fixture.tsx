'use client'

import { useState } from 'react'
import TurnTimeline from '@/app/campaign/[id]/scenes/[sceneId]/turn-timeline'
import styles from '@/app/campaign/[id]/scenes/[sceneId]/map-workspace.module.css'
import { I18nProvider } from '@/lib/i18n'
import { battleInitiative } from '../campaign-ui/maps-data'
import SceneRoster from '@/app/campaign/[id]/scenes/[sceneId]/scene-roster'

// Imports the production components and CSS without auth, actions or database clients.
export default function ProductionLayoutFixture() {
  const [focused, setFocused] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  return (
    <I18nProvider>
      <main className={styles.workspace} style={{ padding: 16 }}>
        <div className={styles.layout}>
          <TurnTimeline
            entries={battleInitiative.map((entry, index) => ({
              ...entry,
              is_current: index === 0,
            }))}
            isDm={true}
            onFocusToken={setFocused}
            onOpenPanel={() => setPanelOpen(true)}
          />
          <div data-testid="scene-layout" className={`${styles.layout} ${styles.withRoster}`}>
            <div data-testid="map-viewport" className={styles.viewport}>
              Карта
            </div>
            <SceneRoster
              tokens={battleInitiative.map((entry) => entry.token)}
              activeTokenId="battle-0"
              isDm={true}
              onFocus={setFocused}
              onAdd={() => {}}
            />
          </div>
          <output data-testid="focused-token">{focused}</output>
          {panelOpen && <p role="status">Панель открыта</p>}
        </div>
      </main>
    </I18nProvider>
  )
}
