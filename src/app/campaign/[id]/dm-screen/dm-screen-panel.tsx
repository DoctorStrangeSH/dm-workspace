'use client'

import { useEffect } from 'react'
import { X, BookMarked } from 'lucide-react'
import { useDmScreenContext } from './dm-screen-context'
import DmEntityList from './dm-entity-list'
import { cn } from '@/lib/utils'
import type { Entity } from '@/lib/types'

interface Props {
  entities: Entity[]
  campaignId: string
}

export default function DmScreenPanel({ entities, campaignId }: Props) {
  const { isOpen, close, recentIds, addToRecent } = useDmScreenContext()

  // Esc — закрыть
  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  // Блокируем скролл body, когда панель открыта
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Оверлей */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Панель */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 flex h-screen w-full flex-col border-l border-slate-800 bg-slate-900 shadow-2xl transition-transform sm:w-[400px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-indigo-400" />
            <h2 className="font-semibold">Панель ГМа</h2>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 transition hover:bg-slate-800"
            title="Закрыть (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Список сущностей */}
        <div className="min-h-0 flex-1">
          <DmEntityList
            entities={entities}
            campaignId={campaignId}
            recentIds={recentIds}
            onSelect={(entityId) => {
              addToRecent(entityId)
              close()
            }}
          />
        </div>
      </aside>
    </>
  )
}
