'use client'

import { useState } from 'react'
import { Dices } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { Character } from '@/lib/types'
import CharacterActionDock from '../../characters/[characterId]/character-action-dock'
import CombatDrawer from './combat-drawer'

export default function MyTurn({ character }: { character: Character }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button aria-haspopup="dialog" icon={<Dices size={16} />} onClick={() => setOpen(true)}>
        {t('map.myTurn')}
      </Button>
      {open && (
        <CombatDrawer
          presentation="workspace"
          label={t('map.myTurn')}
          blocked={false}
          onClose={() => setOpen(false)}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] p-3">
            <h2 className="min-w-0 font-semibold break-words">{character.name}</h2>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('map.backToMap')}
            </Button>
          </div>
          <div className="p-3">
            <CharacterActionDock data={character.data_json} />
          </div>
        </CombatDrawer>
      )}
    </>
  )
}
