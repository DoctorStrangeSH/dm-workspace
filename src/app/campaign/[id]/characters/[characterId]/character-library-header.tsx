'use client'

import Link from 'next/link'
import { BookOpen, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description: string
  catalogHref: string
  catalogLabel: string
  children?: ReactNode
}

export default function CharacterLibraryHeader({
  title,
  description,
  catalogHref,
  catalogLabel,
  children,
}: Props) {
  return (
    <header className="mb-5 rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(115deg,var(--bg-surface),var(--bg-secondary))] p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <BookOpen
          size={24}
          aria-hidden="true"
          className="mt-1 shrink-0 text-[var(--accent-text)]"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={catalogHref}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          {catalogLabel}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        {children}
      </div>
    </header>
  )
}
