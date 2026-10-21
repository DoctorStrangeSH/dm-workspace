'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Глобальная Error Boundary для критических ошибок в root layout.tsx.
 * Срабатывает, если ошибка в ThemeProvider, ToastProvider, или в самом layout.
 * Заменяет ВЕСЬ документ (включая <html> и <body>).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error)
  }, [error])

  return (
    <html lang="ru">
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

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '8px',
              }}
            >
              Критическая ошибка
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#a1a1aa',
                marginBottom: '24px',
              }}
            >
              Приложение не может загрузиться. Обнови страницу.
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
              Обновить
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
