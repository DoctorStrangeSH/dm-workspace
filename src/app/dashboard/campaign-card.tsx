'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Copy, RefreshCw, Trash2, Crown, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Badge, Button, IconButton, Dialog, Tooltip } from '@/components/ui'
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
      setShowDeleteConfirm(false)
    })
  }

  return (
    <>
      <Card padding="md" hoverable className="group flex flex-col">
        <div className="mb-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              {campaign.role === 'dm' && (
                <Crown size={16} className="shrink-0 text-[var(--warning)]" />
              )}
              {campaign.role === 'player' && (
                <Users size={16} className="shrink-0 text-[var(--info)]" />
              )}
              <Link
                href={`/campaign/${campaign.id}`}
                className="truncate text-lg font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-text)]"
              >
                {campaign.name}
              </Link>
            </div>
            {campaign.genre && (
              <Badge variant="accent" size="sm">
                {campaign.genre}
              </Badge>
            )}
          </div>
        </div>

        {campaign.description && (
          <p className="mb-4 line-clamp-2 text-sm text-[var(--text-muted)]">
            {campaign.description}
          </p>
        )}

        {campaign.role === 'dm' && (
          <div className="mt-auto border-t border-[var(--border-default)] pt-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2">
                <code className="flex-1 truncate font-mono text-xs text-[var(--text-secondary)]">
                  {inviteUrl}
                </code>
              </div>
              <Tooltip content="Скопировать ссылку">
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Скопировать ссылку"
                  onClick={handleCopy}
                  disabled={isPending}
                >
                  {copied ? (
                    <Check size={16} className="text-[var(--success)]" />
                  ) : (
                    <Copy size={16} />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip content="Перегенерировать код">
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Перегенерировать код"
                  onClick={handleRegenerate}
                  disabled={isPending}
                >
                  <RefreshCw size={16} className={cn(isPending && 'animate-spin')} />
                </IconButton>
              </Tooltip>
              <Tooltip content="Удалить кампанию">
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Удалить кампанию"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="text-[var(--danger)]"
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Удалить кампанию?"
        description={`«${campaign.name}» будет удалена навсегда. Восстановить нельзя.`}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} loading={isPending}>
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          Это действие нельзя отменить. Все главы, сущности, персонажи и сцены будут удалены.
        </p>
      </Dialog>
    </>
  )
}
