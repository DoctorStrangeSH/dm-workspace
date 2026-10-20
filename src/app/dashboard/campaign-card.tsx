'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Copy, RefreshCw, Trash2, Crown, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampaignWithRole } from '@/lib/types'
import { deleteCampaign, regenerateInviteCode } from '@/lib/actions/campaigns'

interface Props {
  campaign: CampaignWithRole
}

export default function CampaignCard({ campaign }: Props) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState(campaign.invite_code)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // CHANGES: убран useEffect(setInviteUrl) → вычисляем во время рендера.
  // window.location.origin не меняется, поэтому не нужен state + effect.
  // На SSR (typeof window === 'undefined') используем относительный путь,
  // на клиенте — полный URL. Это безопасно: hydration не сломается,
  // потому что inviteUrl используется только в обработчике копирования
  // (клиент) и в <code> (текст, не гидратируется как атрибут).
  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const handleRegenerate = () => {
    startTransition(async () => {
      const res = await regenerateInviteCode(campaign.id)
      if (res.success && res.inviteCode) {
        setInviteCode(res.inviteCode)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCampaign(campaign.id)
      if ('error' in res) {
        alert(res.error)
      }
    })
  }

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700">
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {campaign.role === 'dm' && <Crown size={16} className="shrink-0 text-amber-400" />}
            {campaign.role === 'player' && <Users size={16} className="shrink-0 text-indigo-400" />}
            <Link
              href={`/campaign/${campaign.id}`}
              className="truncate text-lg font-semibold transition hover:text-indigo-400"
            >
              {campaign.name}
            </Link>
          </div>
          {campaign.genre && (
            <span className="rounded-full border border-indigo-900/50 bg-indigo-950/60 px-2 py-0.5 text-xs text-indigo-300">
              {campaign.genre}
            </span>
          )}
        </div>
      </div>

      {campaign.description && (
        <p className="mb-4 line-clamp-2 text-sm text-slate-400">{campaign.description}</p>
      )}

      {campaign.role === 'dm' && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
              <code className="flex-1 truncate text-xs text-slate-300">{inviteUrl}</code>
            </div>
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="rounded-lg p-2 transition hover:bg-slate-800 disabled:opacity-50"
              title="Скопировать ссылку"
            >
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-slate-400" />
              )}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isPending}
              className="rounded-lg p-2 transition hover:bg-slate-800 disabled:opacity-50"
              title="Перегенерировать код"
            >
              <RefreshCw size={16} className={cn('text-slate-400', isPending && 'animate-spin')} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="rounded-lg p-2 transition hover:bg-red-950/50 disabled:opacity-50"
              title="Удалить кампанию"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-2 text-lg font-semibold">Удалить кампанию?</h3>
            <p className="mb-6 text-sm text-slate-400">
              «{campaign.name}» будет удалена навсегда. Восстановить нельзя.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="rounded-lg bg-slate-800 px-4 py-2 transition hover:bg-slate-700"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 transition hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? 'Удаляем...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
