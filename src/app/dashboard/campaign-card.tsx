'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, RefreshCw, Trash2, Crown, Users, Check, ArrowUpRight, BookOpen } from 'lucide-react'
import { Card, Badge, Button, Dialog } from '@/components/ui'
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
  const router = useRouter()
  const titleId = useId()
  const [isPending, startTransition] = useTransition()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [inviteOverride, setInviteOverride] = useState<{ source: string; code: string } | null>(
    null
  )
  const inviteCode =
    inviteOverride?.source === campaign.invite_code ? inviteOverride.code : campaign.invite_code
  const copied = copiedCode === inviteCode
  const [confirmation, setConfirmation] = useState<'regenerate' | 'delete' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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
      setCopiedCode(inviteCode)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopiedCode(null), 2000)
    } catch (e) {
      console.error('Copy failed', e)
      toast.error(t('common.error'))
    }
  }

  const openConfirmation = (action: 'regenerate' | 'delete') => {
    setActionError(null)
    setConfirmation(action)
  }

  const handleConfirm = () => {
    if (!confirmation || isPending) return
    setActionError(null)
    startTransition(async () => {
      try {
        if (confirmation === 'regenerate') {
          const res = await regenerateInviteCode(campaign.id)
          if ('error' in res) {
            setActionError(res.error ?? t('common.error'))
            return
          }
          setInviteOverride({ source: campaign.invite_code, code: res.inviteCode })
          setCopiedCode(null)
          if (copiedTimer.current) clearTimeout(copiedTimer.current)
        } else {
          const res = await deleteCampaign(campaign.id)
          if ('error' in res) {
            setActionError(res.error ?? t('common.error'))
            return
          }
        }
        setConfirmation(null)
        router.refresh()
      } catch {
        setActionError(t('campaign.requestUnconfirmed'))
      }
    })
  }

  return (
    <>
      <Card
        role="article"
        aria-labelledby={titleId}
        padding="none"
        hoverable
        className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-lg)]"
      >
        {/* Decorative treatment, no image request or layout shift. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden bg-[linear-gradient(115deg,var(--bg-elevated),var(--bg-secondary))]"
        >
          <div className="absolute -top-16 -right-8 h-52 w-52 rounded-full border border-[var(--accent)]/20" />
          <div className="absolute -top-10 right-5 h-40 w-40 rounded-full border border-[var(--accent)]/15" />
          <div className="absolute top-6 right-16 h-20 w-20 rotate-45 border border-[var(--accent)]/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-40" />
        </div>

        <div className="relative flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-6 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hover)] bg-[var(--bg-app)]/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[var(--text-secondary)] backdrop-blur-sm">
              {campaign.role === 'dm' ? (
                <Crown aria-hidden="true" size={13} className="text-[var(--accent-text)]" />
              ) : (
                <Users aria-hidden="true" size={13} className="text-[var(--info)]" />
              )}
              {t(campaign.role === 'dm' ? 'role.dm' : 'role.player')}
            </span>
            <BookOpen size={18} className="text-[var(--accent-text)]/65" aria-hidden="true" />
          </div>

          <h3 id={titleId}>
            <Link
              href={`/campaign/${campaign.id}`}
              className="group/title flex min-h-11 min-w-0 items-start justify-between gap-3 rounded-md text-lg leading-snug font-semibold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{campaign.name}</span>
              <ArrowUpRight
                size={19}
                className="mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5"
                aria-hidden="true"
              />
            </Link>
          </h3>

          {campaign.genre && (
            <div className="mt-3">
              <Badge
                variant="accent"
                size="sm"
                className="max-w-full [overflow-wrap:anywhere] whitespace-normal"
              >
                {campaign.genre}
              </Badge>
            </div>
          )}

          {campaign.description ? (
            <p className="mt-3 mb-4 line-clamp-2 text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-[var(--text-muted)]">
              {campaign.description}
            </p>
          ) : (
            <div className="min-h-4 flex-1" aria-hidden="true" />
          )}

          {campaign.role === 'dm' && (
            <div className="mt-auto space-y-3 border-t border-[var(--border-default)] pt-4">
              <div className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] p-3">
                <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">
                  {t('campaign.inviteLink')}
                </p>
                <code className="block text-xs [overflow-wrap:anywhere] text-[var(--text-secondary)]">
                  {inviteUrl}
                </code>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopy}
                disabled={isPending}
                className="w-full"
                icon={
                  copied ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )
                }
              >
                {t('campaign.copyLink')}
              </Button>
              {copied && (
                <p role="status" className="text-sm text-[var(--success-text)]">
                  {t('campaign.linkCopied')}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => openConfirmation('regenerate')}
                  disabled={isPending}
                  icon={<RefreshCw size={16} aria-hidden="true" />}
                  className="w-full sm:w-auto"
                >
                  {t('campaign.regenerateCode')}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => openConfirmation('delete')}
                  disabled={isPending}
                  icon={<Trash2 size={16} aria-hidden="true" />}
                  className="w-full text-[var(--danger-text)] sm:w-auto"
                >
                  {t('campaign.deleteTitle')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog
        open={confirmation !== null}
        onClose={() => !isPending && setConfirmation(null)}
        closeLabel={t('common.close')}
        closeDisabled={isPending}
        title={t(
          confirmation === 'regenerate'
            ? 'campaign.regenerateConfirm.title'
            : 'campaign.deleteConfirm.title'
        )}
        description={t(
          confirmation === 'regenerate'
            ? 'campaign.regenerateConfirm.description'
            : 'campaign.deleteConfirm.description',
          { name: campaign.name }
        )}
        size="sm"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmation(null)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant={confirmation === 'delete' ? 'danger' : 'primary'}
              size="md"
              onClick={handleConfirm}
              loading={isPending}
            >
              {t(confirmation === 'delete' ? 'common.delete' : 'campaign.regenerateCode')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-muted)]">
          {t(
            confirmation === 'regenerate'
              ? 'campaign.regenerateConfirm.membersUnchanged'
              : 'campaign.deleteConfirm.cannotUndo'
          )}
        </p>
        {actionError && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-[var(--danger-subtle)] p-3 text-sm [overflow-wrap:anywhere] text-[var(--danger-text)]"
          >
            {actionError}
          </p>
        )}
      </Dialog>
    </>
  )
}
