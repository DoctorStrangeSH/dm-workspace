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
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Панель */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-full sm:w-[400px] bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-indigo-400" />
            <h2 className="font-semibold">Панель ГМа</h2>
          </div>
          <button
            onClick={close}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            title="Закрыть (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Список сущностей */}
        <div className="flex-1 min-h-0">
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