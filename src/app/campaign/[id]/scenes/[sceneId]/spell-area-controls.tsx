'use client'

import { useState } from 'react'
import {
  Circle,
  Triangle,
  MoveRight,
  Square,
  RotateCcw,
  RotateCw,
  LocateFixed,
  Eraser,
  X,
  Sparkles,
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { AREA_PRESETS } from '@/lib/maps/spell-areas'
import type { AreaShape } from '@/lib/maps/spell-areas'

function Dimension({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const t = useT()
  const [draft, setDraft] = useState<string | null>(null)
  const invalid =
    draft !== null &&
    (draft.trim() === '' ||
      !Number.isFinite(Number(draft)) ||
      Number(draft) < 5 ||
      Number(draft) > 300)
  return (
    <Input
      label={label}
      type="number"
      min={5}
      max={300}
      step="any"
      value={draft ?? value}
      error={invalid ? t('areas.sizeError') : undefined}
      className="min-h-11"
      onChange={(event) => {
        const text = event.target.value
        setDraft(text)
        const next = Number(text)
        if (text.trim() && Number.isFinite(next) && next >= 5 && next <= 300) onChange(next)
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
    />
  )
}

interface Props {
  shape: AreaShape
  size: number
  width: number
  placed: boolean
  onShape: (shape: AreaShape) => void
  onSize: (value: number) => void
  onWidth: (value: number) => void
  onPreset: (preset: (typeof AREA_PRESETS)[number]) => void
  onCenter: () => void
  onRotate: (direction: number) => void
  onClear: () => void
  onClose: () => void
}

export default function SpellAreaControls({
  shape,
  size,
  width,
  placed,
  onShape,
  onSize,
  onWidth,
  onPreset,
  onCenter,
  onRotate,
  onClear,
  onClose,
}: Props) {
  const t = useT()
  const shapes = [
    { type: 'sphere', Icon: Circle },
    { type: 'cone', Icon: Triangle },
    { type: 'line', Icon: MoveRight },
    { type: 'cube', Icon: Square },
  ] as const
  return (
    <section
      aria-label={t('areas.title')}
      className="border-b border-[var(--border-default)] bg-[var(--accent-subtle)] p-3 sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Sparkles size={17} aria-hidden="true" />
          {t('areas.title')}
        </h2>
        <Button
          variant="ghost"
          className="min-h-11 min-w-11 !px-2"
          aria-label={t('areas.close')}
          onClick={onClose}
        >
          <X size={18} />
        </Button>
      </div>
      <div role="group" aria-label={t('areas.shape')} className="mt-2 flex flex-wrap gap-2">
        {shapes.map(({ type, Icon }) => (
          <Button
            key={type}
            variant={shape === type ? 'primary' : 'secondary'}
            className="min-h-11 text-xs"
            aria-pressed={shape === type}
            icon={<Icon size={15} />}
            onClick={() => onShape(type)}
          >
            {t('areas.' + type)}
          </Button>
        ))}
      </div>
      <details className="mt-3">
        <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm font-medium text-[var(--accent-text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
          {t('areas.presets')}
        </summary>
        <div role="group" aria-label={t('areas.presets')} className="flex flex-wrap gap-2 pb-3">
          {AREA_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              variant="secondary"
              className="min-h-11 text-xs"
              onClick={(event) => {
                onPreset(preset)
                event.currentTarget.closest('details')?.removeAttribute('open')
              }}
            >
              {t('areas.' + preset.key)}
            </Button>
          ))}
        </div>
      </details>
      <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <Dimension
          label={t(
            shape === 'sphere' ? 'areas.radius' : shape === 'cube' ? 'areas.side' : 'areas.length'
          )}
          value={size}
          onChange={onSize}
        />
        {shape === 'line' && (
          <Dimension label={t('areas.width')} value={width} onChange={onWidth} />
        )}
      </div>
      <div role="group" aria-label={t('areas.position')} className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="min-h-11 text-xs"
          icon={<LocateFixed size={15} />}
          onClick={onCenter}
        >
          {t('areas.center')}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 min-w-11 !px-2"
          disabled={!placed || shape === 'sphere'}
          aria-label={t('areas.rotateLeft')}
          onClick={() => onRotate(-1)}
        >
          <RotateCcw size={17} />
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 min-w-11 !px-2"
          disabled={!placed || shape === 'sphere'}
          aria-label={t('areas.rotateRight')}
          onClick={() => onRotate(1)}
        >
          <RotateCw size={17} />
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 text-xs"
          disabled={!placed}
          icon={<Eraser size={15} />}
          onClick={onClear}
        >
          {t('areas.clear')}
        </Button>
      </div>
      <p role="status" className="mt-3 text-sm text-[var(--text-primary)]">
        {t(placed ? 'areas.placed' : 'areas.placeHint')}
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{t('areas.keyboardHint')}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{t('areas.localHint')}</p>
    </section>
  )
}
