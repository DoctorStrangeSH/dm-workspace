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
          <mark
            key={i}
            className="bg-amber-500/30 text-amber-200 rounded px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  )
}