'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Plus,
  Swords,
  Eraser,
  Ruler,
  Circle,
  MoveRight,
  Triangle,
} from 'lucide-react'
import { setActiveScene, uploadMap } from '@/lib/actions/scenes'
import { startCombat } from '@/lib/actions/combat'
import { clearFog } from '@/lib/actions/fog'
import { useToast } from '@/components/toast/toast-provider'
import MapCanvas from './map-canvas'
import TokenLayer from './token-layer'
import AddTokenModal from './add-token-modal'
import InitiativePanel from './initiative-panel'
import FogLayer from './fog-layer'
import RulerTool from './ruler-tool'
import TemplateTool from './template-tool'
import { useHotkey } from '@/lib/hooks/use-hotkey'
import { cn } from '@/lib/utils'
import type {
  Scene,
  Token,
  Character,
  Entity,
  InitiativeEntryWithToken,
  FogArea,
} from '@/lib/types'

type ActiveTool = 'none' | 'ruler' | 'cone' | 'sphere' | 'line'

interface Props {
  scene: Scene
  tokens: Token[]
  characters: Character[]
  monsters: Entity[]
  initiative: InitiativeEntryWithToken[]
  initialFog: FogArea[]
  campaignId: string
  isDm: boolean
  currentUserId: string | null
}

export default function SceneView({
  scene,
  tokens,
  characters,
  monsters,
  initiative,
  initialFog,
  campaignId,
  isDm,
  currentUserId,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showAddToken, setShowAddToken] = useState(false)
  const [showInitiative, setShowInitiative] = useState(false)
  const [fogEnabled, setFogEnabled] = useState(scene.fog_enabled ?? false)
  const [brushMode, setBrushMode] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>('none')
  const [templateSize, setTemplateSize] = useState(30)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Хоткеи
  useHotkey({
    code: 'KeyG',
    handler: () => setShowGrid((g) => !g),
    ignoreInInputs: true,
  })

  useHotkey({
    code: 'KeyT',
    ctrl: true,
    handler: () => {
      if (isDm) setShowAddToken(true)
    },
    ignoreInInputs: true,
  })

  useHotkey({
    code: 'KeyB',
    ctrl: true,
    handler: () => {
      if (isDm) {
        if (initiative.length === 0) handleStartCombat()
        else setShowInitiative((v) => !v)
      }
    },
    ignoreInInputs: true,
  })

  useHotkey({
    code: 'KeyF',
    ctrl: true,
    handler: () => {
      if (isDm) setFogEnabled((v) => !v)
    },
    ignoreInInputs: true,
  })

  const handleActivate = () => {
    startTransition(async () => {
      const res = await setActiveScene(scene.id, campaignId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Сцена активирована')
        router.refresh()
      }
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const res = await uploadMap(scene.id, campaignId, file)
    setIsUploading(false)

    if ('error' in res) {
      toast.error(res.error ?? 'Ошибка')
    } else {
      toast.success('Карта загружена')
      router.refresh()
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleStartCombat = () => {
    startTransition(async () => {
      const res = await startCombat(scene.id)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Бой начат')
        setShowInitiative(true)
        router.refresh()
      }
    })
  }

  const handleClearFog = () => {
    if (!confirm('Очистить весь туман?')) return
    startTransition(async () => {
      const res = await clearFog(scene.id)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Туман очищен')
        router.refresh()
      }
    })
  }

  const refresh = () => router.refresh()
  const currentTurn = initiative.find((e) => e.is_current)

  return (
    <div>
      {/* Панель */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{scene.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {scene.width}×{scene.height} клеток · {scene.grid_size}px
            {scene.is_active && (
              <span className="ml-2 text-green-400">· Активна</span>
            )}
            {' · '}
            <span>
              {tokens.length} {tokens.length === 1 ? 'токен' : 'токенов'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            title={showGrid ? 'Скрыть сетку (G)' : 'Показать сетку (G)'}
          >
            {showGrid ? <Eye size={14} /> : <EyeOff size={14} />}
            Сетка
          </button>

          {isDm && !scene.is_active && (
            <button
              onClick={handleActivate}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50"
            >
              <Eye size={14} />
              Активировать
            </button>
          )}

          {/* Инструменты */}
          <button
            onClick={() =>
              setActiveTool(activeTool === 'ruler' ? 'none' : 'ruler')
            }
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition',
              activeTool === 'ruler'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
            title="Линейка"
          >
            <Ruler size={14} />
          </button>

          <button
            onClick={() =>
              setActiveTool(activeTool === 'cone' ? 'none' : 'cone')
            }
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition',
              activeTool === 'cone'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
            title="Конус"
          >
            <Triangle size={14} />
          </button>

          <button
            onClick={() =>
              setActiveTool(activeTool === 'sphere' ? 'none' : 'sphere')
            }
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition',
              activeTool === 'sphere'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
            title="Сфера"
          >
            <Circle size={14} />
          </button>

          <button
            onClick={() =>
              setActiveTool(activeTool === 'line' ? 'none' : 'line')
            }
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition',
              activeTool === 'line'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
            title="Линия"
          >
            <MoveRight size={14} />
          </button>

          {isDm && (
            <button
              onClick={() => setShowAddToken(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition"
              title="Добавить токен (Ctrl+T)"
            >
              <Plus size={14} />
              Токен
            </button>
          )}

          {isDm && initiative.length === 0 && (
            <button
              onClick={handleStartCombat}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition disabled:opacity-50"
              title="Начать бой (Ctrl+B)"
            >
              <Swords size={14} />
              Начать бой
            </button>
          )}

          {initiative.length > 0 && (
            <button
              onClick={() => setShowInitiative(!showInitiative)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
            >
              <Swords size={14} />
              Бой ({initiative.length})
            </button>
          )}

          {isDm && (
            <>
              <button
                onClick={() => setFogEnabled(!fogEnabled)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition',
                  fogEnabled
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                )}
                title="Туман войны (Ctrl+F)"
              >
                {fogEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
                Туман
              </button>

              {fogEnabled && (
                <button
                  onClick={() => setBrushMode(!brushMode)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition',
                    brushMode
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                  title="Кисть — открыть область"
                >
                  <Plus size={14} />
                  Кисть
                </button>
              )}

              {fogEnabled && (
                <button
                  onClick={handleClearFog}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition disabled:opacity-50"
                  title="Очистить туман"
                >
                  <Eraser size={14} />
                </button>
              )}
            </>
          )}

          {isDm && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {scene.image_url ? 'Заменить карту' : 'Загрузить карту'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Индикатор текущего хода */}
      {currentTurn && (
        <div className="mb-3 flex items-center justify-between gap-2 px-4 py-2 bg-red-950/30 border border-red-900/40 rounded-lg">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-red-400" />
            <span className="text-sm text-slate-300">
              Ход:{' '}
              <strong className="text-white">{currentTurn.token.name}</strong>
            </span>
          </div>
          <button
            onClick={() => setShowInitiative(true)}
            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition"
          >
            Панель боя
          </button>
        </div>
      )}

      {/* Размер шаблона */}
      {(activeTool === 'cone' ||
        activeTool === 'sphere' ||
        activeTool === 'line') && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-slate-400">
            Размер{' '}
            {activeTool === 'cone'
              ? 'конуса'
              : activeTool === 'sphere'
                ? 'сферы'
                : 'линии'}
            :
          </span>
          <input
            type="number"
            value={templateSize}
            onChange={(e) => setTemplateSize(Number(e.target.value) || 5)}
            min={5}
            max={120}
            step={5}
            className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <span className="text-sm text-slate-500">футов</span>
        </div>
      )}

      {/* Пустая сцена */}
      {tokens.length === 0 && isDm && (
        <div className="mb-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-center text-sm text-slate-500">
          Сцена пуста. Добавь первый токен кнопкой{' '}
          <strong className="text-slate-300">«Токен»</strong>.
        </div>
      )}

      {/* Карта + слои */}
      <div className="flex justify-center">
        <div
          className="relative"
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 250px)',
            overflow: 'auto',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <MapCanvas scene={scene} showGrid={showGrid} />
            <TokenLayer
              scene={scene}
              initialTokens={tokens}
              isDm={isDm}
              currentUserId={currentUserId}
              onRefresh={refresh}
            />
            <FogLayer
              scene={scene}
              initialFog={initialFog}
              isDm={isDm}
              fogEnabled={fogEnabled}
              brushMode={brushMode}
            />
            {activeTool === 'ruler' && (
              <RulerTool scene={scene} isActive={true} />
            )}
            {(activeTool === 'cone' ||
              activeTool === 'sphere' ||
              activeTool === 'line') && (
              <TemplateTool
                scene={scene}
                isActive={true}
                type={activeTool}
                size={templateSize}
              />
            )}
          </div>
        </div>
      </div>

      {/* Модалки */}
      {showAddToken && (
        <AddTokenModal
          scene={scene}
          characters={characters}
          monsters={monsters}
          onClose={() => setShowAddToken(false)}
        />
      )}

      {showInitiative && initiative.length > 0 && (
        <InitiativePanel
          sceneId={scene.id}
          initialInitiative={initiative}
          isDm={isDm}
          onClose={() => setShowInitiative(false)}
        />
      )}
    </div>
  )
}