'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Hash, Plus } from 'lucide-react'
import { addTagToEntity } from '@/lib/actions/tags'
import { useToast } from '@/components/toast/toast-provider'
import { normalizeTagName } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Tag, EntityTag } from '@/lib/types'

interface Props {
  entityId: string
  campaignId: string
  existingTags: EntityTag[]
  availableTags: Tag[]
}

export default function TagInput({
  entityId,
  campaignId,
  existingTags,
  availableTags,
}: Props) {
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const existingIds = useMemo(
    () => new Set(existingTags.map((t) => t.id)),
    [existingTags]
  )

  const filtered = useMemo(() => {
    const q = normalizeTagName(query)
    return availableTags
      .filter((t) => !existingIds.has(t.id))
      .filter((t) => !q || t.name.includes(q))
      .slice(0, 10)
  }, [availableTags, existingIds, query])

  const normalizedQuery = normalizeTagName(query)
  const canCreate =
    normalizedQuery.length > 0 &&
    !availableTags.some((t) => t.name === normalizedQuery) &&
    !existingIds.has(normalizedQuery)

  const handleAdd = async (tagName: string) => {
    setIsPending(true)
    const res = await addTagToEntity(entityId, campaignId, tagName)
    setIsPending(false)

    if ('error' in res) {
      toast.error(res.error ?? 'Ошибка')
      return
    }

    toast.success(`Тег #${normalizeTagName(tagName)} добавлен`)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const itemsCount = filtered.length + (canCreate ? 1 : 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, itemsCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex < filtered.length && filtered[activeIndex]) {
        handleAdd(filtered[activeIndex].name)
      } else if (canCreate) {
        handleAdd(query)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg focus-within:border-indigo-500 transition">
        <Hash size={14} className="text-slate-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Добавить тег..."
          disabled={isPending}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none min-w-[120px]"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleAdd(query)}
            disabled={isPending || !normalizedQuery}
            className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-50"
            title="Добавить"
          >
            <Plus size={14} className="text-indigo-400" />
          </button>
        )}
      </div>

      {isOpen && (filtered.length > 0 || canCreate) && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.map((tag, i) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleAdd(tag.name)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition',
                i === activeIndex
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/60'
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium">#{tag.name}</span>
              {tag.entitiesCount !== undefined && (
                <span className="ml-auto text-xs text-slate-500">
                  {tag.entitiesCount}
                </span>
              )}
            </button>
          ))}

          {canCreate && (
            <button
              type="button"
              onClick={() => handleAdd(query)}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm border-t border-slate-800 transition',
                activeIndex === filtered.length
                  ? 'bg-indigo-950/60 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60'
              )}
            >
              <Plus size={14} />
              <span>
                Создать{' '}
                <span className="font-medium">#{normalizedQuery}</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}