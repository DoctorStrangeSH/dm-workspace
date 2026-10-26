'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Eye, EyeOff, Minus, Plus, Heart, Users, UserPlus, X } from 'lucide-react'
import {
  updateTokenHP,
  toggleTokenVisibility,
  deleteToken,
  updateTokenConditions,
} from '@/lib/actions/tokens'
import { addTokenOwner, removeTokenOwner } from '@/lib/actions/token-owners'
import { useToast } from '@/components/toast/toast-provider'
import { CONDITION_LIST } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button, IconButton, Dialog } from '@/components/ui'
import { useT } from '@/lib/i18n'
import type { Scene, Token, TokenCondition, TokenOwnerWithProfile } from '@/lib/types'

interface Props {
  token: Token
  scene: Scene
  isDm: boolean
  currentUserId: string | null
  campaignMembers?: Array<{ user_id: string; username: string; display_name: string | null }>
  tokenOwners?: TokenOwnerWithProfile[]
  onClose: () => void
  onUpdate: () => void
}

export default function TokenMenu({
  token,
  scene,
  isDm,
  currentUserId,
  campaignMembers = [],
  tokenOwners = [],
  onClose,
  onUpdate,
}: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [hpInput, setHpInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [localHP, setLocalHP] = useState<number | null>(token.hp_current)

  const [prevHP, setPrevHP] = useState(token.hp_current)
  if (token.hp_current !== prevHP) {
    setPrevHP(token.hp_current)
    setLocalHP(token.hp_current)
  }

  // CHANGES (задача 5): localConditions — оптимистичное обновление,
  // чтобы статус отображался сразу, без router.refresh().
  const [localConditions, setLocalConditions] = useState<TokenCondition[]>(() => token.conditions)
  const [prevConditions, setPrevConditions] = useState(token.conditions)
  if (token.conditions !== prevConditions) {
    setPrevConditions(token.conditions)
    setLocalConditions(token.conditions)
  }

  // CHANGES (задача 4): canEdit — owner_id ИЛИ token_owners
  const isAdditionalOwner = tokenOwners.some(
    (o) => o.token_id === token.id && o.user_id === currentUserId
  )
  const canEdit = isDm || token.owner_id === currentUserId || isAdditionalOwner
  const hasValidHP = localHP !== null && Number.isSafeInteger(localHP) && token.hp_max !== null && Number.isSafeInteger(token.hp_max) && token.hp_max > 0 && localHP >= 0
  const hpPercent = hasValidHP ? Math.min(100, Math.max(0, (localHP! / (token.hp_max ?? 1)) * 100)) : 0

  // CHANGES (5.3): владельцы токена
  const owners = tokenOwners.filter((o) => o.token_id === token.id)
  const ownerUserIds = new Set(owners.map((o) => o.user_id))
  const availableMembers = campaignMembers.filter(
    (m) => m.user_id !== token.owner_id && !ownerUserIds.has(m.user_id)
  )

  const handleHP = (delta: number) => {
    if (localHP === null) return
    const newHP = Math.min(token.hp_max ?? 0, Math.max(0, localHP + delta))
    setLocalHP(newHP)
    startTransition(async () => {
      const res = await updateTokenHP(token.id, scene.id, newHP)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        setLocalHP(token.hp_current)
      } else onUpdate()
    })
  }

  const handleCustomHP = (sign: 1 | -1) => {
    const value = Number(hpInput)
    if (!Number.isSafeInteger(value) || value <= 0 || localHP === null) return
    handleHP(sign * value)
    setHpInput('')
  }

  const handleToggleVisibility = () => {
    startTransition(async () => {
      const res = await toggleTokenVisibility(token.id, scene.id)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else onUpdate()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteToken(token.id, scene.id)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('scenes.toast.tokenDeleted'))
        router.refresh()
        setShowDeleteConfirm(false)
        onClose()
      }
    })
  }

  // CHANGES (задача 5): используем localConditions + оптимистичное обновление
  const handleToggleCondition = (cond: { name: string; icon: string }) => {
    if (!canEdit || isPending) return
    const existing = localConditions.find((c) => c.name === cond.name)
    const newConditions: TokenCondition[] = existing
      ? localConditions.filter((c) => c.name !== cond.name)
      : [...localConditions, { name: cond.name, icon: cond.icon }]

    setLocalConditions(newConditions) // оптимистично

    startTransition(async () => {
      const res = await updateTokenConditions(token.id, scene.id, newConditions)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        setLocalConditions(token.conditions) // откат
      } else onUpdate()
    })
  }

  const handleAddOwner = (userId: string) => {
    startTransition(async () => {
      const res = await addTokenOwner(token.id, userId, scene.campaign_id, scene.id)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('scenes.owners.toast.added'))
        onUpdate()
      }
    })
  }

  const handleRemoveOwner = (userId: string) => {
    startTransition(async () => {
      const res = await removeTokenOwner(token.id, userId, scene.campaign_id, scene.id)
      if ('error' in res) toast.error(res.error ?? t('common.error'))
      else {
        toast.success(t('scenes.owners.toast.removed'))
        onUpdate()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg"
              style={{ borderColor: token.color, backgroundColor: `${token.color}33` }}
            >
              ⚔️
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">{token.name}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t('scenes.token.size', { size: token.size })}
              </p>
            </div>
          </div>
          <IconButton variant="ghost" size="sm" label={t('common.close')} onClick={onClose}>
            <span className="text-lg leading-none">✕</span>
          </IconButton>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* HP */}
          {hasValidHP && (
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Heart size={14} className="text-[var(--danger)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">HP</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {localHP} / {token.hp_max}
                </span>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-[var(--bg-app)]" role="progressbar" aria-label="HP" aria-valuemin={0} aria-valuemax={token.hp_max ?? 0} aria-valuenow={localHP ?? 0}>
                <div
                  className={cn(
                    'h-full transition-all',
                    hpPercent > 50
                      ? 'bg-[var(--success)]'
                      : (localHP / token.hp_max) * 100 > 25
                        ? 'bg-[var(--warning)]'
                        : 'bg-[var(--danger)]'
                  )}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
              {canEdit && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {[-5, -1, +1, +5].map((delta) => (
                      <Button
                        key={delta}
                        variant={delta < 0 ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleHP(delta)}
                        disabled={isPending}
                        className="text-xs"
                      >
                        {delta > 0 ? '+' : ''}
                        {delta}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={hpInput}
                      onChange={(e) => setHpInput(e.target.value)}
                      placeholder="N"
                      min={1}
                      className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCustomHP(-1)}
                      disabled={isPending || !hpInput}
                      icon={<Minus size={12} />}
                      aria-label={t('scenes.token.hpSubtract')}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCustomHP(1)}
                      disabled={isPending || !hpInput}
                      icon={<Plus size={12} />}
                      aria-label={t('scenes.token.hpAdd')}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {localConditions.length > 0 && (
            <section aria-label={t('scenes.token.conditions')} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{t('scenes.token.conditions')} · {localConditions.length}</h3>
              <div className="flex flex-wrap gap-1.5">
                {localConditions.map((cond, index) => (
                  <span key={`${cond.name}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-[var(--warning)]/30 bg-[var(--warning-subtle)] px-2.5 py-1 text-xs text-[var(--warning-text)]">
                    <span aria-hidden="true">{cond.icon ?? '●'}</span>
                    {t(`condition.${cond.name}`)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Владельцы (только DM) */}
          {isDm && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users size={14} className="text-[var(--accent-text)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {t('scenes.owners.title')}
                </span>
              </div>

              {token.owner_id && (
                <div className="mb-1 flex items-center justify-between rounded border border-[var(--accent)]/30 bg-[var(--accent-subtle)] px-2 py-1 text-xs">
                  <span className="truncate text-[var(--accent-text)]">
                    {campaignMembers.find((m) => m.user_id === token.owner_id)?.display_name ??
                      campaignMembers.find((m) => m.user_id === token.owner_id)?.username ??
                      token.owner_id.slice(0, 8)}
                  </span>
                  <span className="ml-2 shrink-0 text-[10px] text-[var(--text-subtle)]">
                    {t('scenes.owners.primary')}
                  </span>
                </div>
              )}

              {owners.map((o) => (
                <div
                  key={o.user_id}
                  className="mb-1 flex items-center justify-between rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs"
                >
                  <span className="truncate text-[var(--text-secondary)]">
                    {o.profile.display_name ?? o.profile.username}
                  </span>
                  <button
                    onClick={() => handleRemoveOwner(o.user_id)}
                    disabled={isPending}
                    className="ml-2 shrink-0 rounded p-0.5 hover:bg-[var(--danger-subtle)] disabled:opacity-50"
                    title={t('scenes.owners.remove')}
                  >
                    <X size={10} className="text-[var(--danger)]" />
                  </button>
                </div>
              ))}

              {availableMembers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {availableMembers.map((m) => (
                    <button
                      key={m.user_id}
                      onClick={() => handleAddOwner(m.user_id)}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] disabled:opacity-50"
                    >
                      <UserPlus size={10} />
                      {m.display_name ?? m.username}
                    </button>
                  ))}
                </div>
              )}

              {availableMembers.length === 0 && owners.length === 0 && !token.owner_id && (
                <p className="text-xs text-[var(--text-subtle)]">{t('scenes.owners.empty')}</p>
              )}
            </div>
          )}

          {/* Условия — CHANGES (задача 5): localConditions */}
          {canEdit && (
            <div>
              <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                {t('scenes.token.conditions')}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {CONDITION_LIST.map((cond) => {
                  const active = localConditions.some((c) => c.name === cond.name)
                  return (
                    <button
                      key={cond.name}
                      onClick={() => handleToggleCondition(cond)}
                      disabled={isPending}
                      aria-pressed={active}
                      className={cn(
                        'flex min-h-10 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                        active
                          ? 'border border-[var(--warning)]/30 bg-[var(--warning-subtle)] text-[var(--warning-text)]'
                          : 'border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                      )}
                    >
                      <span>{cond.icon}</span>
                      <span className="truncate">{t(`condition.${cond.name}`)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Действия ГМ */}
          {isDm && (
            <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleToggleVisibility}
                disabled={isPending}
                icon={token.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                className="w-full justify-start"
              >
                {token.is_hidden
                  ? t('scenes.token.showToPlayers')
                  : t('scenes.token.hideFromPlayers')}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                icon={<Trash2 size={14} />}
                className="w-full"
              >
                {t('scenes.token.delete')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => !isPending && setShowDeleteConfirm(false)}
        title={t('scenes.token.deleteConfirm.title')}
        description={t('scenes.token.deleteConfirm.description', { name: token.name })}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          {t('scenes.token.deleteConfirm.cannotUndo')}
        </p>
      </Dialog>
    </div>
  )
}
