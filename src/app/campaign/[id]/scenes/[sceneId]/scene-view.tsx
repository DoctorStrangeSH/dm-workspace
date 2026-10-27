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
  Square,
  Trash2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react'
import { setActiveScene, uploadMap } from '@/lib/actions/scenes'
import { startCombat } from '@/lib/actions/combat'
import { clearFog } from '@/lib/actions/fog'
import { createWall, deleteAllWalls } from '@/lib/actions/walls'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Input, Dropdown, Tooltip, Dialog } from '@/components/ui'
import MapCanvas from './map-canvas'
import TokenLayer from './token-layer'
import AddTokenModal from './add-token-modal'
import InitiativePanel from './initiative-panel'
import FogLayer from './fog-layer'
import RulerTool from './ruler-tool'
import TemplateTool from './template-tool'
import WallsLayer from './walls-layer'
import SummonDialog from './summon-dialog'
import SummonRequestsPanel from './summon-requests-panel'
import { useHotkey } from '@/lib/hooks/use-hotkey'
import { useI18n } from '@/lib/i18n'
import { pluralize } from '@/lib/i18n/plural'
import type {
  Scene,
  SceneWall,
  SummonRequestWithRequester,
  Token,
  Character,
  Entity,
  InitiativeEntryWithToken,
  FogArea,
  TokenOwnerWithProfile,
} from '@/lib/types'

type ActiveTool = 'none' | 'ruler' | 'cone' | 'sphere' | 'line' | 'wall'

interface Props {
  scene: Scene
  tokens: Token[]
  characters: Character[]
  monsters: Entity[]
  initiative: InitiativeEntryWithToken[]
  initialTokenOwners?: TokenOwnerWithProfile[]
  campaignMembers?: Array<{ user_id: string; username: string; display_name: string | null }>
  initialFog: FogArea[]
  initialWalls: SceneWall[]
  initialSummonRequests: SummonRequestWithRequester[]
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
  initialTokenOwners = [],
  campaignMembers = [],
  initialFog,
  initialWalls,
  initialSummonRequests,
  campaignId,
  isDm,
  currentUserId,
}: Props) {
  const { t, lang } = useI18n()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [mapZoom, setMapZoom] = useState(1)
  const mapViewportRef = useRef<HTMLDivElement>(null)
  const [showAddToken, setShowAddToken] = useState(false)
  const [showInitiative, setShowInitiative] = useState(false)
  const [showSummon, setShowSummon] = useState(false)
  const [fogEnabled, setFogEnabled] = useState(scene.fog_enabled ?? false)
  const [brushMode, setBrushMode] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>('none')
  const [templateSize, setTemplateSize] = useState(30)
  const [showClearFogConfirm, setShowClearFogConfirm] = useState(false)
  const [showClearWallsConfirm, setShowClearWallsConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // CHANGES (задача 2): localWalls — оптимистичное добавление стен
  const [localWalls, setLocalWalls] = useState<SceneWall[]>(() => initialWalls)
  const [prevInitialWalls, setPrevInitialWalls] = useState(initialWalls)
  if (initialWalls !== prevInitialWalls) {
    setPrevInitialWalls(initialWalls)
    setLocalWalls(initialWalls)
  }

  // Состояние для рисования стен
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null)
  const [wallPreview, setWallPreview] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)
  const wallWrapperRef = useRef<HTMLDivElement>(null)
  const mapWidth = scene.width * scene.grid_size
  const mapHeight = scene.height * scene.grid_size

  const changeMapZoom = (next: number) => {
    const zoom = Math.min(2, Math.max(0.5, Math.round(next * 4) / 4))
    if (zoom === mapZoom) return
    const viewport = mapViewportRef.current
    const centerX = viewport ? (viewport.scrollLeft + viewport.clientWidth / 2) / mapZoom : 0
    const centerY = viewport ? (viewport.scrollTop + viewport.clientHeight / 2) / mapZoom : 0
    setMapZoom(zoom)
    requestAnimationFrame(() => {
      const target = mapViewportRef.current
      if (target) {
        target.scrollLeft = centerX * zoom - target.clientWidth / 2
        target.scrollTop = centerY * zoom - target.clientHeight / 2
      }
    })
  }

  const resetMapView = () => {
    setMapZoom(1)
    requestAnimationFrame(() => {
      const viewport = mapViewportRef.current
      if (viewport) {
        viewport.scrollLeft = Math.max(0, (mapWidth - viewport.clientWidth) / 2)
        viewport.scrollTop = Math.max(0, (mapHeight - viewport.clientHeight) / 2)
      }
    })
  }

  const tokensPlural = (n: number) =>
    pluralize(lang, n, {
      one: t('scenes.tokens.one'),
      few: t('scenes.tokens.few'),
      many: t('scenes.tokens.many'),
    })

  const cellsPlural = (n: number) =>
    pluralize(lang, n, {
      one: t('scenes.cells.one'),
      few: t('scenes.cells.few'),
      many: t('scenes.cells.many'),
    })

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

  useHotkey({
    code: 'Escape',
    handler: () => {
      if (activeTool !== 'none') {
        setActiveTool('none')
        setWallStart(null)
        setWallPreview(null)
      }
    },
    ignoreInInputs: false,
  })

  const handleActivate = () => {
    startTransition(async () => {
      const res = await setActiveScene(scene.id, campaignId)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('scenes.toast.activated'))
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
      toast.error(res.error ?? t('common.error'))
    } else {
      toast.success(t('scenes.toast.mapUploaded'))
      router.refresh()
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleStartCombat = () => {
    startTransition(async () => {
      const res = await startCombat(scene.id)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('scenes.toast.combatStarted'))
        setShowInitiative(true)
        router.refresh()
      }
    })
  }

  const doClearFog = () => {
    startTransition(async () => {
      const res = await clearFog(scene.id)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('scenes.toast.fogCleared'))
        router.refresh()
      }
      setShowClearFogConfirm(false)
    })
  }

  const doClearWalls = () => {
    startTransition(async () => {
      const res = await deleteAllWalls(scene.id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('scenes.toast.wallsCleared', { count: res.count }))
        setLocalWalls([]) // CHANGES: очистить local
        router.refresh()
      }
      setShowClearWallsConfirm(false)
    })
  }

  const refresh = () => router.refresh()
  const currentTurn = initiative.find((e) => e.is_current)

  const getGridCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!wallWrapperRef.current) return null
    const rect = wallWrapperRef.current.getBoundingClientRect()
    const rawX = (e.clientX - rect.left) / (scene.grid_size * mapZoom)
    const rawY = (e.clientY - rect.top) / (scene.grid_size * mapZoom)
    return {
      x: Math.round(rawX * 2) / 2,
      y: Math.round(rawY * 2) / 2,
    }
  }

  const handleWallMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'wall' || !isDm) return
    e.preventDefault()
    const coords = getGridCoords(e)
    if (!coords) return

    if (!wallStart) {
      setWallStart(coords)
      setWallPreview({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y })
    } else {
      const dx = coords.x - wallStart.x
      const dy = coords.y - wallStart.y
      if (Math.hypot(dx, dy) < 0.1) {
        setWallStart(null)
        setWallPreview(null)
        return
      }

      startTransition(async () => {
        const res = await createWall(scene.id, campaignId, {
          x1: wallStart.x,
          y1: wallStart.y,
          x2: coords.x,
          y2: coords.y,
        })
        if ('error' in res) {
          toast.error(res.error ?? t('common.error'))
        } else {
          // CHANGES (задача 2): оптимистичное добавление
          if ('wall' in res) {
            setLocalWalls((prev) => [...prev, res.wall])
          }
          toast.success(t('scenes.toast.wallCreated'))
          router.refresh()
        }
        setWallStart(null)
        setWallPreview(null)
      })
    }
  }

  const handleWallMouseMove = (e: React.MouseEvent) => {
    if (activeTool !== 'wall' || !wallStart) return
    const coords = getGridCoords(e)
    if (!coords) return
    setWallPreview({
      x1: wallStart.x,
      y1: wallStart.y,
      x2: coords.x,
      y2: coords.y,
    })
  }

  // CHANGES (задача 1): убран дубль стены из toolsDropdown.
  // Стена — только в wallsDropdown.
  const toolsDropdown = [
    {
      label: t('scenes.tool.ruler'),
      onClick: () => setActiveTool(activeTool === 'ruler' ? 'none' : 'ruler'),
      icon: <Ruler size={14} />,
    },
    {
      label: t('scenes.tool.cone'),
      onClick: () => setActiveTool(activeTool === 'cone' ? 'none' : 'cone'),
      icon: <Triangle size={14} />,
    },
    {
      label: t('scenes.tool.sphere'),
      onClick: () => setActiveTool(activeTool === 'sphere' ? 'none' : 'sphere'),
      icon: <Circle size={14} />,
    },
    {
      label: t('scenes.tool.line'),
      onClick: () => setActiveTool(activeTool === 'line' ? 'none' : 'line'),
      icon: <MoveRight size={14} />,
    },
  ]

  const fogDropdown = [
    {
      label: fogEnabled ? t('scenes.fog.hide') : t('scenes.fog.show'),
      onClick: () => setFogEnabled((v) => !v),
      icon: fogEnabled ? <EyeOff size={14} /> : <Eye size={14} />,
    },
    {
      label: t('scenes.fog.brush'),
      onClick: () => setBrushMode((v) => !v),
      icon: <Plus size={14} />,
      disabled: !fogEnabled,
    },
    {
      label: t('scenes.fog.clear'),
      onClick: () => setShowClearFogConfirm(true),
      icon: <Eraser size={14} />,
      disabled: !fogEnabled || isPending,
    },
  ]

  const wallsDropdown = [
    {
      label: t('scenes.walls.tool'),
      onClick: () => {
        setActiveTool(activeTool === 'wall' ? 'none' : 'wall')
        setWallStart(null)
        setWallPreview(null)
      },
      icon: <Square size={14} />,
    },
    {
      label: t('scenes.walls.clear'),
      onClick: () => setShowClearWallsConfirm(true),
      icon: <Trash2 size={14} />,
      disabled: localWalls.length === 0 || isPending,
    },
  ]

  const templateLabel =
    activeTool === 'cone'
      ? t('scenes.template.cone')
      : activeTool === 'sphere'
        ? t('scenes.template.sphere')
        : t('scenes.template.line')

  return (
    <div>
      {/* Панель */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)]">{scene.name}</h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {t('scenes.dimensions', {
              width: scene.width,
              height: scene.height,
              cells: cellsPlural(scene.width),
              gridSize: scene.grid_size,
            })}
            {scene.is_active && (
              <span className="ml-2 text-[var(--success)]">· {t('scenes.active')}</span>
            )}
            {' · '}
            <span>
              {tokens.length} {tokensPlural(tokens.length)}
            </span>
          </p>
        </div>

        {/* ─── Mobile ─── */}
        <div className="flex items-center gap-2 md:hidden">
          {isDm && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowAddToken(true)}
            >
              {t('scenes.token')}
            </Button>
          )}

          {!isDm && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={() => setShowSummon(true)}
            >
              {t('summon.button')}
            </Button>
          )}

          {initiative.length > 0 ? (
            <Button
              variant="danger"
              size="sm"
              icon={<Swords size={14} />}
              onClick={() => setShowInitiative(!showInitiative)}
            >
              {t('scenes.combatWithCount', { count: initiative.length })}
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
                {t('scenes.combat')}
              </Button>
            )
          )}

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" icon={<MoreHorizontal size={14} />}>
                {t('common.more')}
              </Button>
            }
            items={[
              {
                label: showGrid ? t('scenes.grid.hide') : t('scenes.grid.show'),
                onClick: () => setShowGrid(!showGrid),
                icon: showGrid ? <Eye size={14} /> : <EyeOff size={14} />,
              },
              ...toolsDropdown,
              ...(isDm ? fogDropdown : []),
              ...(isDm ? wallsDropdown : []),
              ...(isDm
                ? [
                    {
                      label: scene.image_url ? t('scenes.map.replace') : t('scenes.map.upload'),
                      onClick: () => fileInputRef.current?.click(),
                      icon: <Upload size={14} />,
                    },
                  ]
                : []),
            ]}
            align="right"
          />
        </div>

        {/* ─── Desktop ─── */}
        <div className="hidden items-center gap-2 md:flex">
          <Tooltip content={showGrid ? t('scenes.grid.hideHint') : t('scenes.grid.showHint')}>
            <Button
              variant={showGrid ? 'secondary' : 'ghost'}
              size="sm"
              icon={showGrid ? <Eye size={14} /> : <EyeOff size={14} />}
              onClick={() => setShowGrid(!showGrid)}
            >
              {t('scenes.grid.label')}
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
              {t('scenes.activate')}
            </Button>
          )}

          {isDm && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowAddToken(true)}
              title={t('scenes.tokenAddHint')}
            >
              {t('scenes.token')}
            </Button>
          )}

          {!isDm && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={() => setShowSummon(true)}
            >
              {t('summon.button')}
            </Button>
          )}

          {isDm && initiative.length === 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Swords size={14} />}
              onClick={handleStartCombat}
              disabled={isPending}
              title={t('scenes.combatStartHint')}
            >
              {t('scenes.combatStart')}
            </Button>
          )}

          {initiative.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Swords size={14} />}
              onClick={() => setShowInitiative(!showInitiative)}
            >
              {t('scenes.combatWithCount', { count: initiative.length })}
            </Button>
          )}

          <div className="mx-1 h-6 w-px bg-[var(--border-default)]" aria-hidden="true" />

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" icon={<MoreHorizontal size={14} />}>
                {t('scenes.tools')}
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
                  {t('scenes.fog.label')}
                </Button>
              }
              items={fogDropdown}
              align="right"
            />
          )}

          {isDm && (
            <Dropdown
              trigger={
                <Button
                  variant={activeTool === 'wall' ? 'secondary' : 'ghost'}
                  size="sm"
                  icon={<Square size={14} />}
                >
                  {t('scenes.walls.label')}
                </Button>
              }
              items={wallsDropdown}
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
                {scene.image_url ? t('scenes.map.replace') : t('scenes.map.upload')}
              </Button>
            </>
          )}
        </div>
      </div>

      {isDm && initialSummonRequests.length > 0 && (
        <SummonRequestsPanel
          campaignId={campaignId}
          sceneId={scene.id}
          initialRequests={initialSummonRequests}
        />
      )}

      {currentTurn && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-subtle)] px-4 py-2">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-[var(--danger)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {t('scenes.currentTurn')}:{' '}
              <strong className="text-[var(--text-primary)]">{currentTurn.token.name}</strong>
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowInitiative(true)}>
            {t('scenes.combatPanel')}
          </Button>
        </div>
      )}

      {activeTool === 'wall' && (
        <div className="mb-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-3 py-2 text-sm text-[var(--accent-text)]">
          {wallStart ? t('scenes.walls.hintSecondClick') : t('scenes.walls.hintFirstClick')}
        </div>
      )}

      {(activeTool === 'cone' || activeTool === 'sphere' || activeTool === 'line') && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">
            {t('scenes.template.size', { tool: templateLabel })}:
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
          <span className="text-sm text-[var(--text-subtle)]">{t('scenes.template.feet')}</span>
        </div>
      )}

      {tokens.length === 0 && isDm && (
        <div className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-3 text-center text-sm text-[var(--text-muted)]">
          {t('scenes.emptyHint')}
        </div>
      )}

      {/* Масштабирование сохраняет координаты карты и всех её слоёв. */}
      <div className="mb-2 flex items-center justify-end gap-2" role="group" aria-label="Масштаб карты">
        <button type="button" aria-label="Уменьшить масштаб карты" title="Уменьшить масштаб" disabled={mapZoom <= 0.5} onClick={() => changeMapZoom(mapZoom - 0.25)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40">
          <ZoomOut size={17} />
        </button>
        <span className="min-w-12 text-center text-sm tabular-nums text-[var(--text-secondary)]" aria-live="polite">{Math.round(mapZoom * 100)}%</span>
        <button type="button" aria-label="Увеличить масштаб карты" title="Увеличить масштаб" disabled={mapZoom >= 2} onClick={() => changeMapZoom(mapZoom + 0.25)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] disabled:opacity-40">
          <ZoomIn size={17} />
        </button>
        <button type="button" aria-label="Сбросить масштаб и центрировать карту" title="100% и центр карты" onClick={resetMapView} className="flex h-9 items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)]">
          <Maximize size={16} /> 100%
        </button>
      </div>

      {/* Карта + слои */}
      <div className="flex justify-center">
        <div
          ref={mapViewportRef}
          className="relative w-full overflow-auto"
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 250px)',
            touchAction: 'pan-x pan-y pinch-zoom',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ width: mapWidth * mapZoom, height: mapHeight * mapZoom, position: 'relative' }}>
          <div
            ref={wallWrapperRef}
            style={{ position: 'absolute', top: 0, left: 0, width: mapWidth, height: mapHeight, transform: `scale(${mapZoom})`, transformOrigin: 'top left' }}
            onMouseDown={handleWallMouseDown}
            onMouseMove={handleWallMouseMove}
          >
            <MapCanvas scene={scene} showGrid={showGrid} />

            <WallsLayer
              scene={scene}
              initialWalls={localWalls}
              isDm={isDm}
              previewWall={wallPreview}
            />

            <TokenLayer
              scene={scene}
              zoomScale={mapZoom}
              initialTokens={tokens}
              isDm={isDm}
              currentUserId={currentUserId}
              walls={localWalls}
              initialTokenOwners={initialTokenOwners}
              campaignMembers={campaignMembers}
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

      {showSummon && (
        <SummonDialog
          campaignId={campaignId}
          sceneId={scene.id}
          monsters={monsters}
          onClose={() => setShowSummon(false)}
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

      <Dialog
        open={showClearFogConfirm}
        onClose={() => !isPending && setShowClearFogConfirm(false)}
        title={t('scenes.clearFogConfirm.title')}
        description={t('scenes.clearFogConfirm.description')}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowClearFogConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={doClearFog} loading={isPending}>
              {t('scenes.clearFogConfirm.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">{t('scenes.clearFogConfirm.cannotUndo')}</p>
      </Dialog>

      <Dialog
        open={showClearWallsConfirm}
        onClose={() => !isPending && setShowClearWallsConfirm(false)}
        title={t('scenes.walls.clearConfirm.title')}
        description={t('scenes.walls.clearConfirm.description')}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowClearWallsConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={doClearWalls} loading={isPending}>
              {t('scenes.walls.clearConfirm.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          {t('scenes.walls.clearConfirm.cannotUndo')}
        </p>
      </Dialog>
    </div>
  )
}
