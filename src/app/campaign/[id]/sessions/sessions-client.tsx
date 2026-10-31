'use client'

import { useId, useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CalendarDays, Clock, Check } from 'lucide-react'
import { createSession, deleteSession, setRsvp } from '@/lib/actions/sessions'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Card, Dialog, Input, Textarea, EmptyState, Badge } from '@/components/ui'
import { useI18n, useT } from '@/lib/i18n'
import { RSVP_LABELS, type SessionWithRsvp, type RsvpStatus } from '@/lib/types'

interface Props {
  campaignId: string
  initialSessions: SessionWithRsvp[]
  isDm: boolean
  viewerId: string | null
}

// Server and the first hydration render agree on UTC, then use the browser's zone.
const subscribeToTimeZone = () => () => {}
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const serverTimeZone = () => 'UTC'

export function SessionsClient({ campaignId, initialSessions, isDm, viewerId }: Props) {
  const { t } = useI18n()
  const timeZone = useSyncExternalStore(subscribeToTimeZone, browserTimeZone, serverTimeZone)
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [rsvpSessionId, setRsvpSessionId] = useState<string | null>(null)
  const [rsvpError, setRsvpError] = useState<{ sessionId: string; message: string } | null>(null)

  const sessions = initialSessions

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setDeleteError(null)
    setRsvpSessionId(null)
    startTransition(async () => {
      const res = await deleteSession(deleteTarget, campaignId)
      if ('error' in res) {
        setDeleteError(res.error ?? t('common.error'))
      } else {
        toast.success(t('sessions.toast.deleted'))
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  const handleRsvp = (sessionId: string, status: RsvpStatus) => {
    if (isPending) return
    setRsvpSessionId(sessionId)
    setRsvpError(null)
    startTransition(async () => {
      try {
        const res = await setRsvp(sessionId, status)
        if ('error' in res) {
          setRsvpError({ sessionId, message: res.error ?? t('common.error') })
        } else {
          router.refresh()
        }
      } catch {
        setRsvpError({ sessionId, message: t('sessions.responseError') })
      }
    })
  }

  if (sessions.length === 0) {
    return (
      <>
        <EmptyState
          icon="📅"
          title={t('sessions.empty.title')}
          description={
            isDm ? t('sessions.empty.descriptionDm') : t('sessions.empty.descriptionPlayer')
          }
          size="lg"
          actions={
            isDm ? [{ label: t('sessions.create'), onClick: () => setShowCreate(true) }] : undefined
          }
        />
        {showCreate && (
          <CreateSessionDialog campaignId={campaignId} onClose={() => setShowCreate(false)} />
        )}
      </>
    )
  }

  return (
    <div className="space-y-3">
      {isDm && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setShowCreate(true)}
          >
            {t('sessions.create')}
          </Button>
        </div>
      )}

      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          timeZone={timeZone}
          viewerId={viewerId}
          isSavingRsvp={isPending && rsvpSessionId === session.id}
          rsvpError={rsvpError?.sessionId === session.id ? rsvpError.message : null}
          isDm={isDm}
          onDelete={() => {
            setDeleteError(null)
            setDeleteTarget(session.id)
          }}
          onRsvp={(status) => handleRsvp(session.id, status)}
          isPending={isPending}
        />
      ))}

      {showCreate && (
        <CreateSessionDialog campaignId={campaignId} onClose={() => setShowCreate(false)} />
      )}

      {/* CHANGES: confirm() → Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !isPending && setDeleteTarget(null)}
        title={t('sessions.deleteConfirm.title')}
        description={t('sessions.deleteConfirm.description')}
        size="sm"
        closeLabel={t('common.close')}
        closeDisabled={isPending}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm} loading={isPending}>
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        <p className="mb-2 font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]">
          {sessions.find((session) => session.id === deleteTarget)?.title}
        </p>
        <p className="text-sm text-[var(--text-muted)]">{t('sessions.deleteConfirm.cannotUndo')}</p>
        {deleteError && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-[var(--danger-subtle)] p-3 text-sm [overflow-wrap:anywhere] text-[var(--danger-text)]"
          >
            {deleteError}
          </p>
        )}
      </Dialog>
    </div>
  )
}

function SessionCard({
  session,
  timeZone,
  viewerId,
  isSavingRsvp,
  rsvpError,
  isDm,
  onDelete,
  onRsvp,
  isPending,
}: {
  session: SessionWithRsvp
  timeZone: string
  viewerId: string | null
  isSavingRsvp: boolean
  rsvpError: string | null
  isDm: boolean
  onDelete: () => void
  onRsvp: (status: RsvpStatus) => void
  isPending: boolean
}) {
  const { t, lang } = useI18n()
  const titleId = useId()
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  const date = new Date(session.starts_at)
  const hasValidDate = Number.isFinite(date.getTime())
  const isPast = hasValidDate && date < new Date()
  const statuses: RsvpStatus[] = ['yes', 'maybe', 'no']
  // Display identity only: setRsvp authenticates the writer independently on the server.
  const savedResponse = viewerId
    ? session.rsvps.find((r) => r.user_id === viewerId)?.status
    : undefined

  return (
    <Card padding="md" role="article" aria-labelledby={titleId} className="rounded-2xl">
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <h3
          id={titleId}
          className="min-w-0 flex-1 text-lg leading-snug font-semibold [overflow-wrap:anywhere] text-[var(--text-primary)]"
        >
          {session.title}
        </h3>
        {isPast && (
          <Badge variant="neutral" size="sm">
            {t('sessions.past')}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)] sm:flex-row sm:flex-wrap sm:gap-x-5">
        <div className="flex min-w-0 items-start gap-2">
          <CalendarDays
            size={16}
            className="mt-0.5 shrink-0 text-[var(--accent-text)]"
            aria-hidden="true"
          />
          {hasValidDate ? (
            <time dateTime={session.starts_at} className="[overflow-wrap:anywhere]">
              {date.toLocaleString(locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
                timeZone,
              })}
            </time>
          ) : (
            <span>{t('sessions.dateUnavailable')}</span>
          )}
        </div>
        <div className="flex items-start gap-2">
          <Clock
            size={16}
            className="mt-0.5 shrink-0 text-[var(--accent-text)]"
            aria-hidden="true"
          />
          <span>{t('sessions.duration', { n: session.duration_minutes })}</span>
        </div>
      </div>

      {session.description && (
        <p className="mt-3 text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap text-[var(--text-secondary)]">
          {session.description}
        </p>
      )}

      <dl className="mt-4 flex flex-wrap gap-2" aria-label={t('sessions.responses')}>
        {statuses.map((status) => (
          <div
            key={status}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-xs"
          >
            <dt className="text-[var(--text-secondary)]">
              <span aria-hidden="true">{RSVP_LABELS[status].icon}</span> {t(`rsvp.${status}`)}
            </dt>
            <dd className="font-semibold text-[var(--text-primary)] tabular-nums">
              {session.rsvps.filter((r) => r.status === status).length}
            </dd>
          </div>
        ))}
      </dl>

      <p aria-live="polite" className="mt-3 text-sm font-medium text-[var(--text-primary)]">
        {t('sessions.yourResponse')}:{' '}
        {savedResponse ? t(`rsvp.${savedResponse}`) : t('sessions.noResponse')}
      </p>

      {((hasValidDate && !isPast) || isDm) && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-default)] pt-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          {hasValidDate && !isPast && (
            <div className="min-w-0" role="group" aria-label={t('sessions.yourResponse')}>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={savedResponse === status ? 'primary' : 'secondary'}
                    aria-pressed={savedResponse === status}
                    size="md"
                    onClick={() => onRsvp(status)}
                    disabled={isPending}
                  >
                    {savedResponse === status && <Check size={16} aria-hidden="true" />}
                    <span aria-hidden="true">{RSVP_LABELS[status].icon}</span> {t(`rsvp.${status}`)}
                  </Button>
                ))}
              </div>
              {isSavingRsvp && (
                <p role="status" className="mt-2 text-sm text-[var(--text-muted)]">
                  {t('sessions.savingResponse')}
                </p>
              )}
              {rsvpError && (
                <p
                  role="alert"
                  className="mt-2 text-sm [overflow-wrap:anywhere] text-[var(--danger-text)]"
                >
                  {rsvpError}
                </p>
              )}
            </div>
          )}
          {isDm && (
            <Button
              variant="ghost"
              size="md"
              icon={<Trash2 size={16} aria-hidden="true" />}
              onClick={onDelete}
              disabled={isPending}
              className="w-full text-[var(--danger-text)] sm:w-auto"
              aria-label={t('sessions.deleteLabel', { title: session.title })}
            >
              {t('common.delete')}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function CreateSessionDialog({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [duration, setDuration] = useState(180)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startsAt) return
    setError(null)

    startTransition(async () => {
      const res = await createSession(campaignId, {
        title,
        description,
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes: duration,
      })
      if ('error' in res) {
        setError(res.error ?? t('common.error'))
      } else {
        toast.success(t('sessions.toast.created'))
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog
      open={true}
      onClose={() => !isPending && onClose()}
      title={t('sessions.createTitle')}
      size="md"
      closeLabel={t('common.close')}
      closeDisabled={isPending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          className="min-h-11 min-w-0"
          label={t('sessions.form.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('sessions.form.titlePlaceholder')}
          required
          autoFocus
        />
        <Input
          className="min-h-11 min-w-0"
          label={t('sessions.form.datetime')}
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />
        <Input
          className="min-h-11 min-w-0"
          label={t('sessions.form.duration')}
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value) || 180)}
          min={30}
          max={600}
          step={30}
        />
        <Textarea
          label={t('common.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={t('sessions.form.descriptionPlaceholder')}
        />

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[var(--danger-subtle)] p-3 text-sm [overflow-wrap:anywhere] text-[var(--danger-text)]"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button variant="primary" size="md" type="submit" loading={isPending}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
