'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Upload,
  Plus,
  Swords,
  Eraser,
  Ruler,
  Circle,
  MoveRight,
  Triangle,
  MoreHorizontal,
} from 'lucide-react'
import { setActiveScene, uploadMap } from '@/lib/actions/scenes'
import { startCombat } from '@/lib/actions/combat'
import { clearFog } from '@/lib/actions/fog'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Input, Dropdown, Tooltip } from '@/components/ui'
import MapCanvas from './map-canvas'
import TokenLayer from './token-layer'
import AddTokenModal from './add-token-modal'
import InitiativePanel from './initiative-panel'
import FogLayer from './fog-layer'
import RulerTool from './ruler-tool'
import TemplateTool from './template-tool'
import { useHotkey } from '@/lib/hooks/use-hotkey'
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

  const toolsDropdown = [
    {
      label: 'Линейка',
      onClick: () => setActiveTool(activeTool === 'ruler' ? 'none' : 'ruler'),
      icon: <Ruler size={14} />,
    },
    {
      label: 'Конус',
      onClick: () => setActiveTool(activeTool === 'cone' ? 'none' : 'cone'),
      icon: <Triangle size={14} />,
    },
    {
      label: 'Сфера',
      onClick: () => setActiveTool(activeTool === 'sphere' ? 'none' : 'sphere'),
      icon: <Circle size={14} />,
    },
    {
      label: 'Линия',
      onClick: () => setActiveTool(activeTool === 'line' ? 'none' : 'line'),
      icon: <MoveRight size={14} />,
    },
  ]

  const fogDropdown = [
    {
      label: fogEnabled ? 'Скрыть туман' : 'Показать туман',
      onClick: () => setFogEnabled((v) => !v),
      icon: fogEnabled ? <EyeOff size={14} /> : <Eye size={14} />,
    },
    {
      label: 'Кисть',
      onClick: () => setBrushMode((v) => !v),
      icon: <Plus size={14} />,
      disabled: !fogEnabled,
    },
    {
      label: 'Очистить туман',
      onClick: handleClearFog,
      icon: <Eraser size={14} />,
      disabled: !fogEnabled || isPending,
    },
  ]

  return (
    <div>
      {/* Панель */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)]">{scene.name}</h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {scene.width}×{scene.height} клеток · {scene.grid_size}px
            {scene.is_active && <span className="ml-2 text-[var(--success)]">· Активна</span>}
            {' · '}
            <span>
              {tokens.length} {tokens.length === 1 ? 'токен' : 'токенов'}
            </span>
          </p>
        </div>

        {/* ─── Mobile: основное + «Ещё» ─── */}
        <div className="flex items-center gap-2 md:hidden">
          {isDm && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowAddToken(true)}
            >
              Токен
            </Button>
          )}

          {initiative.length > 0 ? (
            <Button
              variant="danger"
              size="sm"
              icon={<Swords size={14} />}
              onClick={() => setShowInitiative(!showInitiative)}
            >
              Бой ({initiative.length})
            </Button>
          ) : (
            isDm && (
              <Button
                variant="danger"
                size="sm"
                icon={<Swords size={14} />}
                onClick={handleStartCombat}
                disabled={isPending}
              >
                Бой
              </Button>
            )
          )}

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" icon={<MoreHorizontal size={14} />}>
                Ещё
              </Button>
            }
            items={[
              {
                label: showGrid ? 'Скрыть сетку' : 'Показать сетку',
                onClick: () => setShowGrid(!showGrid),
                icon: showGrid ? <Eye size={14} /> : <EyeOff size={14} />,
              },
              ...toolsDropdown,
              ...(isDm ? fogDropdown : []),
              ...(isDm
                ? [
                    {
                      label: scene.image_url ? 'Заменить карту' : 'Загрузить карту',
                      onClick: () => fileInputRef.current?.click(),
                      icon: <Upload size={14} />,
                    },
                  ]
                : []),
            ]}
            align="right"
          />
        </div>

        {/* ─── Desktop: основное + разделитель + Dropdown'ы ─── */}
        <div className="hidden items-center gap-2 md:flex">
          <Tooltip content={showGrid ? 'Скрыть сетку (G)' : 'Показать сетку (G)'}>
            <Button
              variant={showGrid ? 'secondary' : 'ghost'}
              size="sm"
              icon={showGrid ? <Eye size={14} /> : <EyeOff size={14} />}
              onClick={() => setShowGrid(!showGrid)}
            >
              Сетка
            </Button>
          </Tooltip>

          {isDm && !scene.is_active && (
            <Button
              variant="primary"
              size="sm"
              icon={<Eye size={14} />}
              onClick={handleActivate}
              disabled={isPending}
            >
              Активировать
            </Button>
          )}

          {isDm && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowAddToken(true)}
              title="Добавить токен (Ctrl+T)"
            >
              Токен
            </Button>
          )}

          {isDm && initiative.length === 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Swords size={14} />}
              onClick={handleStartCombat}
              disabled={isPending}
              title="Начать бой (Ctrl+B)"
            >
              Начать бой
            </Button>
          )}

          {initiative.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Swords size={14} />}
              onClick={() => setShowInitiative(!showInitiative)}
            >
              Бой ({initiative.length})
            </Button>
          )}

          <div className="mx-1 h-6 w-px bg-[var(--border-default)]" aria-hidden="true" />

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" icon={<MoreHorizontal size={14} />}>
                Инструменты
              </Button>
            }
            items={toolsDropdown}
            align="right"
          />

          {isDm && (
            <Dropdown
              trigger={
                <Button
                  variant={fogEnabled ? 'secondary' : 'ghost'}
                  size="sm"
                  icon={fogEnabled ? <EyeOff size={14} /> : <Eye size={14} />}
                >
                  Туман
                </Button>
              }
              items={fogDropdown}
              align="right"
            />
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
              <Button
                variant="primary"
                size="sm"
                icon={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
                loading={isUploading}
              >
                {scene.image_url ? 'Заменить карту' : 'Загрузить карту'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Индикатор текущего хода */}
      {currentTurn && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-subtle)] px-4 py-2">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-[var(--danger)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              Ход: <strong className="text-[var(--text-primary)]">{currentTurn.token.name}</strong>
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowInitiative(true)}>
            Панель боя
          </Button>
        </div>
      )}

      {/* Размер шаблона */}
      {(activeTool === 'cone' || activeTool === 'sphere' || activeTool === 'line') && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">
            Размер {activeTool === 'cone' ? 'конуса' : activeTool === 'sphere' ? 'сферы' : 'линии'}:
          </span>
          <Input
            type="number"
            value={templateSize}
            onChange={(e) => setTemplateSize(Number(e.target.value) || 5)}
            min={5}
            max={120}
            step={5}
            className="w-20"
          />
          <span className="text-sm text-[var(--text-subtle)]">футов</span>
        </div>
      )}

      {/* Пустая сцена */}
      {tokens.length === 0 && isDm && (
        <div className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-3 text-center text-sm text-[var(--text-muted)]">
          Сцена пуста. Добавь первый токен кнопкой{' '}
          <strong className="text-[var(--text-secondary)]">«Токен»</strong>.
        </div>
      )}

      {/* Карта + слои */}
      <div className="flex justify-center">
        <div
          className="relative"
          style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}
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
              <RulerTool scene={scene} isActive={true} onClose={() => setActiveTool('none')} />
            )}
            {(activeTool === 'cone' || activeTool === 'sphere' || activeTool === 'line') && (
              <TemplateTool
                scene={scene}
                isActive={true}
                type={activeTool}
                size={templateSize}
                onClose={() => setActiveTool('none')}
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
