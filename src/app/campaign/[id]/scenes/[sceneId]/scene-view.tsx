'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
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
  Hand,
  MousePointer2,
  Expand,
} from 'lucide-react'
import { setActiveScene } from '@/lib/actions/scenes'
import { startCombat } from '@/lib/actions/combat'
import { clearFog } from '@/lib/actions/fog'
import { createWall, deleteAllWalls } from '@/lib/actions/walls'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Input, Dropdown, Dialog } from '@/components/ui'
import { clampZoom, clientToGrid, fitMap } from '@/lib/maps/geometry'
import MapUploadDialog from './map-upload-dialog'
import styles from './map-workspace.module.css'
import MapCanvas from './map-canvas'
import TokenLayer from './token-layer'
import AddTokenModal from './add-token-modal'
import InitiativePanel from './initiative-panel'
import CombatDrawer from './combat-drawer'
import TurnTimeline from './turn-timeline'
import { useRealtimeInitiative } from '@/lib/hooks/use-realtime-initiative'
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

type ActiveTool = 'none' | 'ruler' | 'cone' | 'sphere' | 'line' | 'wall' | 'pan'

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
  const [showUpload, setShowUpload] = useState(false)
  const [fitting, setFitting] = useState(false)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(
    null
  )
  const startBusy = useRef(false)
  const [showGrid, setShowGrid] = useState(true)
  const [mapZoom, setMapZoom] = useState(1)
  const liveInitiative = useRealtimeInitiative({ sceneId: scene.id, initialInitiative: initiative })
  const mapViewportRef = useRef<HTMLDivElement>(null)
  const [showAddToken, setShowAddToken] = useState(false)
  const [showInitiative, setShowInitiative] = useState(false)
  const [combatReturnFocus, setCombatReturnFocus] = useState<HTMLElement | null>(null)
  const combatTriggerRef = useRef<HTMLButtonElement>(null)
  const [mapFocusRequest, setMapFocusRequest] = useState(0)
  const openCombat = (opener?: HTMLElement) => {
    const active = document.activeElement
    setCombatReturnFocus(
      opener ??
        (active instanceof HTMLElement && active !== document.body
          ? active
          : combatTriggerRef.current)
    )
    setShowInitiative(true)
  }
  useEffect(() => {
    // Restore after the portal has unmounted, including Escape before showModal ran.
    if (!showInitiative && combatReturnFocus?.isConnected)
      combatReturnFocus.focus({ preventScroll: true })
  }, [showInitiative, combatReturnFocus])
  useEffect(() => {
    if (mapFocusRequest > 0) {
      mapViewportRef.current?.focus({ preventScroll: true })
    }
  }, [mapFocusRequest])
  const [combatBusy, setCombatBusy] = useState(false)
  const combatBusyRef = useRef(false)
  const reportCombatBusy = useCallback((busy: boolean) => {
    combatBusyRef.current = busy
    setCombatBusy(busy)
  }, [])
  const closeCombat = () => {
    if (!combatBusyRef.current) setShowInitiative(false)
  }
  const [showSummon, setShowSummon] = useState(false)
  const [fogEnabled, setFogEnabled] = useState(scene.fog_enabled ?? false)
  const [brushMode, setBrushMode] = useState(false)
  const [activeTool, setActiveTool] = useState<ActiveTool>('none')
  const [templateSize, setTemplateSize] = useState(30)
  const [showClearFogConfirm, setShowClearFogConfirm] = useState(false)
  const [showClearWallsConfirm, setShowClearWallsConfirm] = useState(false)

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

  useEffect(() => {
    if (!fitting) return
    const viewport = mapViewportRef.current
    if (!viewport) return
    const fit = () => {
      if (viewport.clientWidth <= 32 || viewport.clientHeight <= 32) return
      setMapZoom(fitMap(mapWidth, mapHeight, viewport.clientWidth, viewport.clientHeight))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [fitting, mapWidth, mapHeight])

  const changeMapZoom = (next: number) => {
    const zoom = clampZoom(next)
    const viewport = mapViewportRef.current
    const stage = wallWrapperRef.current
    if (!viewport || !stage) return
    const vr = viewport.getBoundingClientRect()
    const sr = stage.getBoundingClientRect()
    const centerX = (vr.left + viewport.clientWidth / 2 - sr.left) / mapZoom
    const centerY = (vr.top + viewport.clientHeight / 2 - sr.top) / mapZoom
    setFitting(false)
    setMapZoom(zoom)
    requestAnimationFrame(() => {
      const rect = stage.getBoundingClientRect()
      viewport.scrollLeft += rect.left + centerX * zoom - vr.left - viewport.clientWidth / 2
      viewport.scrollTop += rect.top + centerY * zoom - vr.top - viewport.clientHeight / 2
    })
  }
  const resetMapView = () => {
    setFitting(true)
    const viewport = mapViewportRef.current
    if (viewport && viewport.clientWidth > 32 && viewport.clientHeight > 32) {
      setMapZoom(fitMap(mapWidth, mapHeight, viewport.clientWidth, viewport.clientHeight))
      viewport.scrollTo({ left: 0, top: 0 })
    }
  }
  const chooseTool = (tool: ActiveTool) => {
    setBrushMode(false)
    setActiveTool(tool)
    setWallStart(null)
    setWallPreview(null)
  }
  const focusToken = (tokenId: string) => {
    setShowInitiative(false)
    setMapFocusRequest((request) => request + 1)
    const viewport = mapViewportRef.current
    const target = viewport?.querySelector<HTMLElement>(
      '[data-token-id="' + CSS.escape(tokenId) + '"]'
    )
    if (!viewport || !target) return
    const vr = viewport.getBoundingClientRect()
    const tr = target.getBoundingClientRect()
    viewport.scrollLeft += tr.left + tr.width / 2 - vr.left - viewport.clientWidth / 2
    viewport.scrollTop += tr.top + tr.height / 2 - vr.top - viewport.clientHeight / 2
  }
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (workspaceRef.current?.requestFullscreen)
        await workspaceRef.current.requestFullscreen()
      else toast.info(t('map.fullscreenUnavailable'))
    } catch {
      toast.error(t('map.fullscreenUnavailable'))
    }
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
      if (isDm && !combatBusyRef.current) {
        if (showInitiative) closeCombat()
        else openCombat()
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
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return
      if (brushMode) setBrushMode(false)
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

  const handleStartCombat = () => {
    if (startBusy.current || liveInitiative.length > 0) return
    startBusy.current = true
    startTransition(async () => {
      try {
        const res = await startCombat(scene.id)
        if ('error' in res) toast.error(res.error ?? t('common.error'))
        else {
          openCombat()
          router.refresh()
        }
      } catch {
        toast.error(t('map.uncertain'))
      } finally {
        startBusy.current = false
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
  const currentTurns = liveInitiative.filter((entry) => entry.is_current)
  const currentTurn = currentTurns.length === 1 ? currentTurns[0] : undefined

  const getGridCoords = (e: React.PointerEvent) => {
    if (!wallWrapperRef.current) return null
    return clientToGrid(
      e,
      wallWrapperRef.current.getBoundingClientRect(),
      scene.width,
      scene.height,
      'half'
    )
  }

  const handleWallMouseDown = (e: React.PointerEvent) => {
    if (activeTool !== 'wall' || !isDm || isPending || e.button !== 0 || !e.isPrimary) return
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

  const handleWallMouseMove = (e: React.PointerEvent) => {
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
      onClick: () => chooseTool(activeTool === 'ruler' ? 'none' : 'ruler'),
      icon: <Ruler size={14} />,
    },
    {
      label: t('scenes.tool.cone'),
      onClick: () => chooseTool(activeTool === 'cone' ? 'none' : 'cone'),
      icon: <Triangle size={14} />,
    },
    {
      label: t('scenes.tool.sphere'),
      onClick: () => chooseTool(activeTool === 'sphere' ? 'none' : 'sphere'),
      icon: <Circle size={14} />,
    },
    {
      label: t('scenes.tool.line'),
      onClick: () => chooseTool(activeTool === 'line' ? 'none' : 'line'),
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
      onClick: () => {
        setActiveTool('none')
        setBrushMode((v) => !v)
      },
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
        chooseTool(activeTool === 'wall' ? 'none' : 'wall')
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
    <div ref={workspaceRef} className={styles.workspace}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-widest text-[var(--accent-text)] uppercase">
            {t('map.workspace')}
          </p>
          <h1 className="text-2xl font-bold [overflow-wrap:anywhere] text-[var(--text-primary)]">
            {scene.name}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {scene.width} × {scene.height} {cellsPlural(scene.width)} · {tokens.length}{' '}
            {tokensPlural(tokens.length)}
            {scene.is_active ? ' · ' + t('scenes.active') : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDm && (
            <Button
              variant={scene.image_url ? 'secondary' : 'primary'}
              className="min-h-11"
              icon={<Upload size={16} />}
              onClick={() => setShowUpload(true)}
            >
              {scene.image_url ? t('scenes.map.replace') : t('scenes.map.upload')}
            </Button>
          )}
          {isDm ? (
            <Button
              className="min-h-11"
              icon={<Plus size={16} />}
              onClick={() => setShowAddToken(true)}
            >
              {t('scenes.token')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="min-h-11"
              icon={<Sparkles size={16} />}
              onClick={() => setShowSummon(true)}
            >
              {t('summon.button')}
            </Button>
          )}
          <Button
            variant={showInitiative ? 'primary' : 'secondary'}
            className="min-h-11"
            icon={<Swords size={16} />}
            aria-pressed={showInitiative}
            aria-haspopup="dialog"
            ref={combatTriggerRef}
            onClick={(event) => openCombat(event.currentTarget)}
          >
            {t('scenes.initiative.title')}
            {liveInitiative.length > 0 ? ' · ' + liveInitiative.length : ''}
          </Button>
          {isDm && liveInitiative.length === 0 && (
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={isPending || tokens.length === 0}
              onClick={handleStartCombat}
            >
              {t('map.prepareCombat')}
            </Button>
          )}
          {isDm && !scene.is_active && (
            <Button
              variant="ghost"
              className="min-h-11"
              disabled={isPending}
              onClick={handleActivate}
            >
              {t('scenes.activate')}
            </Button>
          )}
        </div>
      </header>
      {isDm && initialSummonRequests.length > 0 && (
        <SummonRequestsPanel
          campaignId={campaignId}
          sceneId={scene.id}
          initialRequests={initialSummonRequests}
        />
      )}

      <TurnTimeline
        entries={liveInitiative}
        isDm={isDm}
        onFocusToken={focusToken}
        onOpenPanel={openCombat}
      />

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
            onChange={(e) =>
              setTemplateSize(Math.min(120, Math.max(5, Number(e.target.value) || 5)))
            }
            min={5}
            max={120}
            step={5}
            className="w-20"
          />
          <span className="text-sm text-[var(--text-subtle)]">{t('scenes.template.feet')}</span>
        </div>
      )}

      <div className={styles.layout}>
        <section
          className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
          aria-label={t('map.workspace')}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] p-2">
            <div
              className="flex flex-wrap items-center gap-1"
              role="group"
              aria-label={t('scenes.tools')}
            >
              <Button
                variant={activeTool === 'none' && !brushMode ? 'secondary' : 'ghost'}
                className="min-h-11"
                aria-pressed={activeTool === 'none' && !brushMode}
                onClick={() => chooseTool('none')}
                icon={<MousePointer2 size={16} />}
              >
                {t('map.select')}
              </Button>
              <Button
                variant={activeTool === 'pan' ? 'secondary' : 'ghost'}
                className="min-h-11"
                aria-pressed={activeTool === 'pan'}
                onClick={() => chooseTool('pan')}
                icon={<Hand size={16} />}
              >
                {t('map.pan')}
              </Button>
              <Button
                variant={activeTool === 'ruler' ? 'secondary' : 'ghost'}
                className="min-h-11"
                aria-pressed={activeTool === 'ruler'}
                onClick={() => chooseTool(activeTool === 'ruler' ? 'none' : 'ruler')}
                icon={<Ruler size={16} />}
              >
                {t('scenes.tool.ruler')}
              </Button>
              <Dropdown
                trigger={
                  <Button variant="ghost" className="min-h-11" icon={<Triangle size={16} />}>
                    {t('map.templates')}
                  </Button>
                }
                items={toolsDropdown.slice(1)}
                align="left"
              />
              <Button
                variant={showGrid ? 'secondary' : 'ghost'}
                className="min-h-11"
                aria-pressed={showGrid}
                onClick={() => setShowGrid((v) => !v)}
              >
                {t('scenes.grid.label')}
              </Button>
              {isDm && (
                <Dropdown
                  trigger={
                    <Button
                      variant="ghost"
                      className="min-h-11"
                      icon={<MoreHorizontal size={16} />}
                    >
                      {t('common.more')}
                    </Button>
                  }
                  items={[...fogDropdown, ...wallsDropdown]}
                  align="left"
                />
              )}
            </div>
            <div
              className="flex flex-wrap items-center gap-1"
              role="group"
              aria-label={t('map.zoom')}
            >
              <Button
                variant="ghost"
                className="min-h-11 min-w-11 !px-2"
                aria-label={t('map.zoomOut')}
                disabled={mapZoom <= 0.05}
                onClick={() => changeMapZoom(mapZoom / 1.25)}
              >
                <ZoomOut size={18} />
              </Button>
              <button
                type="button"
                className="min-h-11 min-w-14 rounded-lg text-sm text-[var(--text-secondary)] tabular-nums"
                onClick={() => changeMapZoom(1)}
                aria-label={t('map.actualSize')}
              >
                {Math.round(mapZoom * 100)}%
              </button>
              <Button
                variant="ghost"
                className="min-h-11 min-w-11 !px-2"
                aria-label={t('map.zoomIn')}
                disabled={mapZoom >= 3}
                onClick={() => changeMapZoom(mapZoom * 1.25)}
              >
                <ZoomIn size={18} />
              </Button>
              <Button
                variant={fitting ? 'secondary' : 'ghost'}
                className="min-h-11"
                onClick={resetMapView}
                icon={<Maximize size={16} />}
              >
                {t('map.fit')}
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 min-w-11 !px-2"
                aria-label={t('map.fullscreen')}
                onClick={toggleFullscreen}
              >
                <Expand size={18} />
              </Button>
            </div>
          </div>
          {!scene.image_url && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[var(--border-default)] bg-[var(--accent-subtle)] p-4">
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">{t('map.emptyTitle')}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {isDm ? t('map.emptyHint') : t('map.playerEmpty')}
                </p>
              </div>
              {isDm && (
                <Button
                  variant="primary"
                  className="min-h-11"
                  onClick={() => setShowUpload(true)}
                  icon={<Upload size={16} />}
                >
                  {t('scenes.map.upload')}
                </Button>
              )}
            </div>
          )}
          <div
            ref={mapViewportRef}
            tabIndex={0}
            role="region"
            aria-label={t('map.viewport')}
            className={
              styles.viewport +
              ' relative w-full overflow-auto bg-[var(--bg-app)] outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]'
            }
            style={{
              touchAction: 'pan-x pan-y pinch-zoom',
              backgroundImage: 'radial-gradient(var(--border-default) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            <div
              className="grid min-h-full min-w-full place-items-center p-4"
              style={{ width: mapWidth * mapZoom + 32, height: mapHeight * mapZoom + 32 }}
            >
              <div
                style={{
                  width: mapWidth * mapZoom,
                  height: mapHeight * mapZoom,
                  position: 'relative',
                }}
              >
                <div
                  ref={wallWrapperRef}
                  data-testid="map-stage"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: mapWidth,
                    height: mapHeight,
                    transform: 'scale(' + mapZoom + ')',
                    transformOrigin: 'top left',
                  }}
                  onPointerDown={handleWallMouseDown}
                  onPointerMove={handleWallMouseMove}
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
                    activeTokenId={currentTurn?.token_id ?? null}
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
                    brushMode={brushMode && activeTool === 'none'}
                  />
                  {activeTool === 'ruler' && (
                    <RulerTool
                      scene={scene}
                      isActive={true}
                      onClose={() => setActiveTool('none')}
                    />
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
                  {activeTool === 'pan' && (
                    <div
                      className="absolute inset-0 z-40 cursor-grab active:cursor-grabbing"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => {
                        if (!e.isPrimary || e.button !== 0 || !mapViewportRef.current) return
                        e.preventDefault()
                        e.currentTarget.setPointerCapture(e.pointerId)
                        panRef.current = {
                          id: e.pointerId,
                          x: e.clientX,
                          y: e.clientY,
                          left: mapViewportRef.current.scrollLeft,
                          top: mapViewportRef.current.scrollTop,
                        }
                      }}
                      onPointerMove={(e) => {
                        const p = panRef.current
                        const view = mapViewportRef.current
                        if (p && view && p.id === e.pointerId) {
                          view.scrollLeft = p.left - (e.clientX - p.x)
                          view.scrollTop = p.top - (e.clientY - p.y)
                        }
                      }}
                      onPointerUp={() => {
                        panRef.current = null
                      }}
                      onPointerCancel={() => {
                        panRef.current = null
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border-default)] px-4 py-3 text-xs text-[var(--text-muted)]">
            <span>
              {brushMode
                ? t('scenes.fog.brush')
                : activeTool === 'pan'
                  ? t('map.panHint')
                  : activeTool === 'none'
                    ? t('map.selectHint')
                    : t('map.drawHint')}
            </span>
            <span>
              {t('map.scaleHint')} · {t('map.escapeHint')}
            </span>
          </div>
        </section>
        {showInitiative && (
          <CombatDrawer label={t('scenes.combatPanel')} blocked={combatBusy} onClose={closeCombat}>
            <InitiativePanel
              sceneId={scene.id}
              entries={liveInitiative}
              isDm={isDm}
              onClose={closeCombat}
              onFocusToken={focusToken}
              onBusyChange={reportCombatBusy}
            />
          </CombatDrawer>
        )}
      </div>
      {showUpload && isDm && (
        <MapUploadDialog
          scene={scene}
          campaignId={campaignId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            toast.success(t('scenes.toast.mapUploaded'))
            router.refresh()
          }}
        />
      )}

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
