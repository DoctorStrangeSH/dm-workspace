'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export default function CampaignError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Campaign Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--danger)]/30 bg-[var(--danger-subtle)]">
          <AlertTriangle size={28} className="text-[var(--danger)]" />
        </div>

        <h1 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Ошибка в кампании</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Не удалось загрузить эту страницу кампании. Попробуй ещё раз.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">
              Детали (dev)
            </summary>
            <pre className="mt-2 overflow-x-auto text-[10px] whitespace-pre-wrap text-[var(--danger-text)]">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" icon={<RefreshCw size={16} />} onClick={reset}>
            Попробовать снова
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary" size="md" icon={<ArrowLeft size={16} />} className="w-full">
              К кампаниям
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
