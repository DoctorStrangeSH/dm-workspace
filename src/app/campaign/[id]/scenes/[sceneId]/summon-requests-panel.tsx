'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { approveSummonRequest, rejectSummonRequest } from '@/lib/actions/summon'
import { useToast } from '@/components/toast/toast-provider'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'
import { useRealtimeSummons } from '@/lib/hooks/use-realtime-summons'
import type { SummonRequestWithRequester } from '@/lib/types'

interface Props {
  campaignId: string
  sceneId: string
  initialRequests: SummonRequestWithRequester[]
}

export default function SummonRequestsPanel({ campaignId, sceneId, initialRequests }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const { requests } = useRealtimeSummons({ campaignId, initialRequests })

  if (requests.length === 0) return null

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveSummonRequest(id, sceneId, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('summon.toast.approved'))
        router.refresh()
      }
    })
  }

  const handleReject = (id: string) => {
    startTransition(async () => {
      const res = await rejectSummonRequest(id, campaignId)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('summon.toast.rejected'))
        router.refresh()
      }
    })
  }

  return (
    <div className="mb-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-subtle)] p-3">
      <h3 className="mb-2 text-sm font-semibold text-[var(--warning-text)]">
        {t('summon.pendingTitle', { count: requests.length })}
      </h3>
      <div className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                {req.monster_name} ×{req.monster_count}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {t('summon.from', {
                  name: req.requester.display_name ?? req.requester.username,
                })}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="primary"
                size="sm"
                icon={<Check size={12} />}
                onClick={() => handleApprove(req.id)}
                disabled={isPending}
              >
                {t('summon.approve')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<X size={12} />}
                onClick={() => handleReject(req.id)}
                disabled={isPending}
              >
                {t('summon.reject')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
