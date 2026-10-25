import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { ToastProvider } from '@/components/toast/toast-provider'
import { ThemeProvider } from '@/lib/hooks/use-theme'
import { I18nProvider } from '@/lib/i18n'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a12' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
}

export const metadata: Metadata = {
  title: 'DM Workspace',
  description: 'Мастерская ГМа',
  metadataBase: new URL('https://dm-workspace.vercel.app'),
  openGraph: {
    title: 'DM Workspace',
    description: 'Мастерская ГМа',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // CHANGES: RootLayout СТАТИЧЕСКИЙ — без cookies()/getLang().
  // Язык применяется inline-скриптом до hydration (см. ниже).
  // Иначе Next.js 16 + cacheComponents падает на /_not-found.
  return (
    <html
      lang="ru"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <Script
          id="theme-lang-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // ─── Тема ───
                  var storedTheme = localStorage.getItem('dm-workspace-theme') || 'dark';
                  var resolved = storedTheme;
                  if (storedTheme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', resolved);

                  // ─── Язык ───
                  var m = document.cookie.match(/(?:^|;\\s*)dm-lang=([^;]+)/);
                  var lang = m && m[1] === 'en' ? 'en' : 'ru';
                  document.documentElement.setAttribute('lang', lang);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <I18nProvider>
          <ThemeProvider initialTheme="dark">
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
