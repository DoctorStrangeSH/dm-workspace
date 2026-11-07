import { useEffect, useState } from 'react'
import { useRealtimeInitiative } from '../../src/lib/hooks/use-realtime-initiative'
import TurnTimeline from '../../src/app/campaign/[id]/scenes/[sceneId]/turn-timeline'
import type { InitiativeEntryWithToken } from '../../src/lib/types'
import { mapInitiative } from './maps-data'

interface Source {
  sceneId: string
  enabled: boolean
  entries: InitiativeEntryWithToken[]
  mounted: boolean
}
function LiveQueue({ sceneId, entries, enabled }: Source) {
  const live = useRealtimeInitiative({ sceneId, initialInitiative: entries, enabled })
  return (
    <>
      <TurnTimeline
        entries={live}
        isDm={new URLSearchParams(location.search).get('role') !== 'player'}
        onFocusToken={() => {}}
        onOpenPanel={() => {}}
      />
      <output data-testid="initiative-data" hidden>
        {JSON.stringify(live)}
      </output>
    </>
  )
}
export default function InitiativeSyncFixture() {
  const [source, setSource] = useState<Source>({
    sceneId: 'offline-scene',
    enabled: true,
    entries: mapInitiative,
    mounted: true,
  })
  useEffect(() => {
    const receive = (event: Event) =>
      setSource((previous) => ({ ...previous, ...(event as CustomEvent<Partial<Source>>).detail }))
    window.addEventListener('offline-initiative-source', receive)
    return () => window.removeEventListener('offline-initiative-source', receive)
  }, [])
  return source.mounted ? <LiveQueue {...source} /> : <p>Queue unmounted</p>
}
