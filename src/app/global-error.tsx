'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { AlertTriangle } from 'lucide-react'

type Lang = 'ru' | 'en'

const T: Record<Lang, { title: string; description: string; retry: string }> = {
  ru: {
    title: 'Критическая ошибка',
    description: 'Приложение не может загрузиться. Обнови страницу.',
    retry: 'Обновить',
  },
  en: {
    title: 'Critical error',
    description: 'The app failed to load. Please reload the page.',
    retry: 'Reload',
  },
}

function readLang(): Lang {
  if (typeof document === 'undefined') return 'en'
  const m = document.cookie.match(/(?:^|;\s*)dm-lang=([^;]+)/)
  return m?.[1] === 'ru' ? 'ru' : 'en'
}

// CHANGES: useSyncExternalStore вместо setState в useEffect.
// SSR-fallback — 'en', клиент — синхронно из cookie.
// Убирает warning react-hooks/set-state-in-effect и cascading renders.
const subscribe = () => () => {}
const getServerSnapshot = (): Lang => 'en'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const lang = useSyncExternalStore(subscribe, readLang, getServerSnapshot)

  useEffect(() => {
    console.error('[Global Error Boundary]', error)
  }, [error])

  const text = T[lang]

  return (
    <html lang={lang}>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: '#0a0a12',
            color: '#e4e4e7',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#12121c',
              border: '1px solid #272734',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertTriangle size={32} style={{ color: '#ef4444' }} />
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              {text.title}
            </h1>
            <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '24px' }}>
              {text.description}
            </p>

            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {text.retry}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
