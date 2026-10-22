'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { createSession, deleteSession, setRsvp } from '@/lib/actions/sessions'
import { useToast } from '@/components/toast/toast-provider'
import { Button, Card, Dialog, Input, EmptyState, Badge } from '@/components/ui'
import { RSVP_LABELS, type SessionWithRsvp, type RsvpStatus } from '@/lib/types'

interface Props {
  campaignId: string
  initialSessions: SessionWithRsvp[]
  isDm: boolean
}

export function SessionsClient({ campaignId, initialSessions, isDm }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)

  const sessions = initialSessions

  const handleDelete = (sessionId: string) => {
    if (!confirm('Удалить сессию?')) return
    startTransition(async () => {
      const res = await deleteSession(sessionId, campaignId)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else {
        toast.success('Сессия удалена')
        router.refresh()
      }
    })
  }

  const handleRsvp = (sessionId: string, status: RsvpStatus) => {
    startTransition(async () => {
      const res = await setRsvp(sessionId, status)
      if ('error' in res) toast.error(res.error ?? 'Ошибка')
      else router.refresh()
    })
  }

  if (sessions.length === 0) {
    return (
      <>
        <EmptyState
          icon="📅"
          title="Пока нет ни одной сессии"
          description={
            isDm
              ? 'Создай первую сессию, чтобы игроки могли запланировать время.'
              : 'ГМ пока не запланировал сессии.'
          }
          size="lg"
          actions={
            isDm ? [{ label: 'Создать сессию', onClick: () => setShowCreate(true) }] : undefined
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
            Создать сессию
          </Button>
        </div>
      )}

      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          isDm={isDm}
          onDelete={() => handleDelete(session.id)}
          onRsvp={(status) => handleRsvp(session.id, status)}
          isPending={isPending}
        />
      ))}

      {showCreate && (
        <CreateSessionDialog campaignId={campaignId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

function SessionCard({
  session,
  isDm,
  onDelete,
  onRsvp,
  isPending,
}: {
  session: SessionWithRsvp
  isDm: boolean
  onDelete: () => void
  onRsvp: (status: RsvpStatus) => void
  isPending: boolean
}) {
  const date = new Date(session.starts_at)
  const isPast = date < new Date()

  const yesCount = session.rsvps.filter((r) => r.status === 'yes').length
  const noCount = session.rsvps.filter((r) => r.status === 'no').length
  const maybeCount = session.rsvps.filter((r) => r.status === 'maybe').length

  return (
    <Card padding="md" className={isPast ? 'opacity-60' : ''}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-semibold text-[var(--text-primary)]">{session.title}</h3>
            {isPast && (
              <Badge variant="neutral" size="sm">
                Прошла
              </Badge>
            )}
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            📅{' '}
            {date.toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            {session.duration_minutes} мин
          </div>
          {session.description && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{session.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-subtle)]">RSVP:</span>
            <Badge variant="success" size="sm">
              ✅ {yesCount}
            </Badge>
            <Badge variant="danger" size="sm">
              ❌ {noCount}
            </Badge>
            <Badge variant="warning" size="sm">
              🤔 {maybeCount}
            </Badge>
          </div>
        </div>

        {isDm && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={onDelete}
            disabled={isPending}
            className="text-[var(--danger)]"
          >
            <span className="sr-only">Удалить</span>
          </Button>
        )}
      </div>

      {!isPast && (
        <div className="mt-3 flex flex-wrap gap-1 border-t border-[var(--border-default)] pt-3">
          {(['yes', 'maybe', 'no'] as RsvpStatus[]).map((status) => (
            <Button
              key={status}
              variant="secondary"
              size="sm"
              onClick={() => onRsvp(status)}
              disabled={isPending}
            >
              {RSVP_LABELS[status].icon} {RSVP_LABELS[status].label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  )
}

function CreateSessionDialog({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [duration, setDuration] = useState(180)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startsAt) return

    startTransition(async () => {
      const res = await createSession(campaignId, {
        title,
        description,
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes: duration,
      })
      if ('error' in res) {
        toast.error(res.error ?? 'Ошибка')
      } else {
        toast.success('Сессия создана')
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <Dialog open={true} onClose={onClose} title="Новая сессия" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Сессия 1: Начало приключения"
          required
          autoFocus
        />
        <Input
          label="Дата и время"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            Длительность (мин)
          </label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 180)}
            min={30}
            max={600}
            step={30}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Что планируется на сессии..."
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--border-focus)] focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button variant="primary" size="md" type="submit" loading={isPending}>
            Создать
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
