'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui'
import type { EntitySuggestion } from '@/lib/codemirror/wikilink-completion'

// CHANGES: CodeMirror грузится лениво — не попадает в начальный бандл.
// ssr: false работает только в Client Component (эта обёртка — 'use client').
const ChapterEditor = dynamic(() => import('./chapter-editor'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <Skeleton height="40px" rounded="lg" />
      <Skeleton height="700px" rounded="lg" />
    </div>
  ),
})

interface Props {
  chapterId: string
  campaignId: string
  initialContent: string
  readOnly: boolean
  entityMap: Record<string, string>
  entities: EntitySuggestion[]
  chapterTitle: string
}

export default function ChapterEditorLazy(props: Props) {
  return <ChapterEditor {...props} />
}
