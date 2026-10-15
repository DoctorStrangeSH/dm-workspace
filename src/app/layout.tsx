// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DM Workspace',
  description: 'Мастерская ГМа',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}