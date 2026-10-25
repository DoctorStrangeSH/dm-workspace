'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createScene } from '@/lib/actions/scenes'
import { useToast } from '@/components/toast/toast-provider'
import { Input, Select, Button, IconButton } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { GridType } from '@/lib/types'

interface Props {
  campaignId: string
  onClose: () => void
}

export default function CreateSceneModal({ campaignId, onClose }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [gridType, setGridType] = useState<GridType>('square')
  const [gridSize, setGridSize] = useState(50)
  const [width, setWidth] = useState(30)
  const [height, setHeight] = useState(20)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('scenes.form.nameRequired'))
      return
    }

    startTransition(async () => {
      const res = await createScene(campaignId, {
        name: name.trim(),
        grid_type: gridType,
        grid_size: gridSize,
        width,
        height,
      })
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }
      toast.success(t('scenes.toast.created'))
      onClose()
    })
  }

  const gridOptions = [
    { value: 'square', label: t('scenes.gridType.square') },
    { value: 'hex', label: t('scenes.gridType.hex') },
    { value: 'none', label: t('scenes.gridType.none') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{t('scenes.form.title')}</h2>
          <IconButton
            variant="ghost"
            size="sm"
            label={t('common.close')}
            onClick={onClose}
            disabled={isPending}
          >
            <X size={18} />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <Input
            label={t('common.name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('scenes.form.namePlaceholder')}
            autoFocus
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('scenes.form.gridType')}
              value={gridType}
              onChange={(e) => setGridType(e.target.value as GridType)}
              options={gridOptions}
            />
            <Input
              label={t('scenes.form.gridSize')}
              type="number"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) || 50)}
              min={20}
              max={150}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('scenes.form.width')}
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value) || 30)}
              min={5}
              max={100}
            />
            <Input
              label={t('scenes.form.height')}
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value) || 20)}
              min={5}
              max={100}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending}>
              {isPending ? t('scenes.form.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
