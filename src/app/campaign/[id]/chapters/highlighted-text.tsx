'use client'

import { splitByQuery } from '@/lib/highlight'

interface Props {
  text: string
  query: string
}

export default function HighlightedText({ text, query }: Props) {
  if (!query.trim()) return <>{text}</>

  const parts = splitByQuery(text, query)

  return (
    <>
      {parts.map((part, i) =>
        part.matched ? (
          <mark key={i} className="rounded bg-amber-500/30 px-0.5 text-amber-200">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  )
}
