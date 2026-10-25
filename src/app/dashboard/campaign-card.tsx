'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Copy, RefreshCw, Trash2, Crown, Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Badge, Button, IconButton, Dialog, Tooltip } from '@/components/ui'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'
import type { CampaignWithRole } from '@/lib/types'
import { deleteCampaign, regenerateInviteCode } from '@/lib/actions/campaigns'

interface Props {
  campaign: CampaignWithRole
}

export default function CampaignCard({ campaign }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [inviteCode, setInviteCode] = useState(campaign.invite_code)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }
  }, [])

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
      toast.error(t('common.error'))
    }
  }

  const handleRegenerate = () => {
    startTransition(async () => {
      const res = await regenerateInviteCode(campaign.id)
      if (res.success && res.inviteCode) {
        setInviteCode(res.inviteCode)
      } else {
        toast.error('error' in res ? (res.error ?? t('common.error')) : t('common.error'))
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCampaign(campaign.id)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
        return
      }
      setShowDeleteConfirm(false)
    })
  }

  return (
    <>
      <Card padding="md" hoverable className="group relative flex min-h-52 flex-col overflow-hidden rounded-xl shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
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
              <Tooltip content={t('campaign.copyLink')}>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('campaign.copyLink')}
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
              <Tooltip content={t('campaign.regenerateCode')}>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('campaign.regenerateCode')}
                  onClick={handleRegenerate}
                  disabled={isPending}
                >
                  <RefreshCw size={16} className={cn(isPending && 'animate-spin')} />
                </IconButton>
              </Tooltip>
              <Tooltip content={t('campaign.deleteTitle')}>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label={t('campaign.deleteTitle')}
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
        title={t('campaign.deleteConfirm.title')}
        description={t('campaign.deleteConfirm.description', { name: campaign.name })}
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
        <p className="text-sm text-[var(--text-muted)]">{t('campaign.deleteConfirm.cannotUndo')}</p>
      </Dialog>
    </>
  )
}
