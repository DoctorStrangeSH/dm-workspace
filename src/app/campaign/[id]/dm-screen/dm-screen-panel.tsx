'use client'

import { useEffect } from 'react'
import { X, BookMarked } from 'lucide-react'
import { useDmScreenContext } from './dm-screen-context'
import DmEntityList from './dm-entity-list'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Entity } from '@/lib/types'

interface Props {
  entities: Entity[]
  campaignId: string
}

export default function DmScreenPanel({ entities, campaignId }: Props) {
  const t = useT()
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

  // Блокируем скролл body только на мобилке (sm:hidden), на desktop — карта видна
  useEffect(() => {
    if (!isOpen) return
    const isMobile = window.matchMedia('(max-width: 639px)').matches
    if (!isMobile) return

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Оверлей — только на мобилке (на desktop карта должна быть видна) */}
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity sm:hidden',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      {/* Панель — w-[320px] на мобилке (не w-full), w-[400px] на desktop.
          z-40 (не 50 — Dialog/Dropdown выше). Токены. */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-40 flex h-screen w-[320px] flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xl transition-transform sm:w-[400px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Заголовок */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookMarked size={18} className="text-[var(--accent-text)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">{t('dmScreen.title')}</h2>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title={t('dmScreen.closeHint')}
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
