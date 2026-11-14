'use client'

import { useState } from 'react'
import TurnTimeline from '@/app/campaign/[id]/scenes/[sceneId]/turn-timeline'
import styles from '@/app/campaign/[id]/scenes/[sceneId]/map-workspace.module.css'
import { I18nProvider } from '@/lib/i18n'
import { battleInitiative } from '../campaign-ui/maps-data'
import SceneRoster from '@/app/campaign/[id]/scenes/[sceneId]/scene-roster'
import CombatDrawer from '@/app/campaign/[id]/scenes/[sceneId]/combat-drawer'

// Imports the production components and CSS without auth, actions or database clients.
export default function ProductionLayoutFixture() {
  const [focused, setFocused] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  return (
    <I18nProvider>
      <main className={styles.workspace} style={{ padding: 16 }}>
        {workspaceOpen && (
          <CombatDrawer
            presentation="workspace"
            label="Preparation workspace"
            blocked={false}
            onClose={() => setWorkspaceOpen(false)}
          >
            <div className="p-5">
              <h2>Preparation workspace</h2>
              <button onClick={() => setWorkspaceOpen(false)}>Close workspace</button>
              <div style={{ height: 1200 }}>Scrollable content</div>
            </div>
          </CombatDrawer>
        )}
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
          <button onClick={() => setWorkspaceOpen(true)}>Open preparation workspace</button>
          {panelOpen && <p role="status">Панель открыта</p>}
        </div>
      </main>
    </I18nProvider>
  )
}
