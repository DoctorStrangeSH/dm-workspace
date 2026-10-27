'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Copy, RefreshCw, Trash2, Crown, Users, Check, ArrowUpRight, BookOpen } from 'lucide-react'
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

  const inviteUrl = `/join/${inviteCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + inviteUrl)
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
      <Card
        padding="none"
        hoverable
        className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-lg)]"
      >
        {/* Decorative treatment, no image request or layout shift. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden bg-[linear-gradient(115deg,var(--bg-elevated),var(--bg-secondary))]">
          <div className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-[var(--accent)]/20" />
          <div className="absolute right-5 -top-10 h-40 w-40 rounded-full border border-[var(--accent)]/15" />
          <div className="absolute right-16 top-6 h-20 w-20 rotate-45 border border-[var(--accent)]/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-40" />
        </div>

        <div className="relative flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-6 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hover)] bg-[var(--bg-app)]/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--text-secondary)] backdrop-blur-sm">
              {campaign.role === 'dm' ? <Crown size={13} className="text-[var(--accent-text)]" /> : <Users size={13} className="text-[var(--info)]" />}
              {t(campaign.role === 'dm' ? 'role.dm' : 'role.player')}
            </span>
            <BookOpen size={18} className="text-[var(--accent-text)]/65" aria-hidden="true" />
          </div>

          <Link
            href={`/campaign/${campaign.id}`}
            className="group/title inline-flex items-start justify-between gap-3 rounded-md text-lg font-semibold leading-snug tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <span className="line-clamp-2 break-words">{campaign.name}</span>
            <ArrowUpRight size={19} className="mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover/title:-translate-y-0.5 group-hover/title:translate-x-0.5" aria-hidden="true" />
          </Link>

          {campaign.genre && (
            <div className="mt-3">
              <Badge variant="accent" size="sm">{campaign.genre}</Badge>
            </div>
          )}

          {campaign.description ? (
            <p className="mb-4 mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {campaign.description}
            </p>
          ) : (
            <div className="min-h-4 flex-1" aria-hidden="true" />
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
        </div>
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
