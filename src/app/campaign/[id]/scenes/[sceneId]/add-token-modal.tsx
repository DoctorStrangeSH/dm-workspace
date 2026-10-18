'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, User, Skull } from 'lucide-react'
import { createToken } from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { cn } from '@/lib/utils'
import type { Scene, Character, Entity } from '@/lib/types'

interface Props {
  scene: Scene
  characters: Character[]
  monsters: Entity[]
  onClose: () => void
}

type Tab = 'character' | 'monster' | 'custom'

export default function AddTokenModal({
  scene,
  characters,
  monsters,
  onClose,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('character')
  const [customName, setCustomName] = useState('')

  const handleAdd = (
    name: string,
    data: {
      characterId?: string
      entityId?: string
      owner_id?: string
      hp_current?: number
      hp_max?: number
    }
  ) => {
    startTransition(async () => {
      const res = await createToken(scene.id, {
        name,
        x: Math.floor(scene.width / 2),
        y: Math.floor(scene.height / 2),
        ...data,
      })
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Токен добавлен')
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="font-semibold">Добавить токен</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Табы */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-800">
          <TabButton
            active={tab === 'character'}
            onClick={() => setTab('character')}
            icon={<User size={14} />}
            label="Персонаж"
          />
          <TabButton
            active={tab === 'monster'}
            onClick={() => setTab('monster')}
            icon={<Skull size={14} />}
            label="Монстр"
          />
          <TabButton
            active={tab === 'custom'}
            onClick={() => setTab('custom')}
            icon={<Plus size={14} />}
            label="Свой"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'character' && (
            <div className="space-y-1">
              {characters.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  Нет персонажей
                </p>
              ) : (
                characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() =>
                      handleAdd(char.name, {
                        characterId: char.id,
                        owner_id: char.user_id,
                        hp_current: char.data_json.hp.current,
                        hp_max: char.data_json.hp.max,
                      })
                    }
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-950/40 border border-amber-900/50 flex items-center justify-center">
                      ⚔️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {char.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        HP {char.data_json.hp.current}/{char.data_json.hp.max}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {tab === 'monster' && (
            <div className="space-y-1">
              {monsters.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  Нет монстров в кампании
                </p>
              ) : (
                monsters.map((m) => (
                  <button
                    key={m.id}
                    onClick={() =>
                      handleAdd(m.name, {
                        entityId: m.id,
                        hp_current: (m.data_json as any)?.hp ?? null,
                        hp_max: (m.data_json as any)?.hp_max ?? null,
                      })
                    }
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center">
                      👹
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {m.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        HP {(m.data_json as any)?.hp ?? '—'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Имя токена
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Неизвестный"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <button
                onClick={() => handleAdd(customName || 'Неизвестный', {})}
                disabled={isPending}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {isPending ? 'Создаём...' : 'Создать токен'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition',
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      )}
    >
      {icon}
      {label}
    </button>
  )
}