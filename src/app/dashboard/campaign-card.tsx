'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import {
  Copy,
  RefreshCw,
  Trash2,
  Crown,
  Users,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampaignWithRole } from '@/lib/types'
import {
  deleteCampaign,
  regenerateInviteCode,
} from '@/lib/actions/campaigns'

interface Props {
  campaign: CampaignWithRole
}

export default function CampaignCard({ campaign }: Props) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState(campaign.invite_code)
  const [inviteUrl, setInviteUrl] = useState(`/join/${campaign.invite_code}`)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Обновляем полный URL только на клиенте, после монтирования
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteUrl(`${window.location.origin}/join/${inviteCode}`)
    }
  }, [inviteCode])

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
    <div className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {campaign.role === 'dm' && (
              <Crown size={16} className="text-amber-400 shrink-0" />
            )}
            {campaign.role === 'player' && (
              <Users size={16} className="text-indigo-400 shrink-0" />
            )}
            <Link
              href={`/campaign/${campaign.id}`}
              className="font-semibold text-lg truncate hover:text-indigo-400 transition"
            >
              {campaign.name}
            </Link>
          </div>
          {campaign.genre && (
            <span className="text-xs px-2 py-0.5 bg-indigo-950/60 border border-indigo-900/50 text-indigo-300 rounded-full">
              {campaign.genre}
            </span>
          )}
        </div>
      </div>

      {campaign.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {campaign.description}
        </p>
      )}

      {campaign.role === 'dm' && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <code className="text-xs text-slate-300 truncate flex-1">
                {inviteUrl}
              </code>
            </div>
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="p-2 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
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
              className="p-2 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
              title="Перегенерировать код"
            >
              <RefreshCw
                size={16}
                className={cn(
                  'text-slate-400',
                  isPending && 'animate-spin'
                )}
              />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="p-2 hover:bg-red-950/50 rounded-lg transition disabled:opacity-50"
              title="Удалить кампанию"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              Удалить кампанию?
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              «{campaign.name}» будет удалена навсегда. Восстановить нельзя.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50"
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