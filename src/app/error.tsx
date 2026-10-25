'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useT } from '@/lib/i18n'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()

  useEffect(() => {
    console.error('[Error Boundary]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] p-4">
      <Card padding="lg" className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--danger)]/30 bg-[var(--danger-subtle)]">
          <AlertTriangle size={32} className="text-[var(--danger)]" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">{t('error.title')}</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">{t('error.description')}</p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">
              {t('error.devDetails')}
            </summary>
            <pre className="mt-2 overflow-x-auto text-[10px] whitespace-pre-wrap text-[var(--danger-text)]">
              {error.message}
              {error.digest && `\n\ndigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" icon={<RefreshCw size={16} />} onClick={reset}>
            {t('error.retry')}
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary" size="md" icon={<Home size={16} />} className="w-full">
              {t('error.goHome')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
