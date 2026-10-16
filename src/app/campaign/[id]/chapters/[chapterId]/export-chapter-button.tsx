'use client'

import { useState, useTransition } from 'react'
import { Download, Check, Loader2 } from 'lucide-react'
import { getChapterForExport } from '@/lib/actions/export'
import { formatChapterAsMarkdown } from '@/lib/export-markdown'
import { downloadText } from '@/lib/download'
import { toFilename } from '@/lib/slugify'

interface Props {
  chapterId: string
  campaignId: string
  chapterTitle: string
}

export default function ExportChapterButton({
  chapterId,
  campaignId,
  chapterTitle,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleExport = () => {
    startTransition(async () => {
      const res = await getChapterForExport(chapterId, campaignId)
      if (res.error || !res.data) {
        alert(res.error ?? 'Не удалось экспортировать')
        return
      }

      const markdown = formatChapterAsMarkdown(res.data)
      const filename = toFilename(chapterTitle, 'md')

      downloadText(markdown, filename)

      setDone(true)
      setTimeout(() => setDone(false), 2000)
    })
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
      title="Скачать .md (Ctrl+E)"
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : done ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Download size={14} />
      )}
      <span className="hidden sm:inline">
        {done ? 'Готово' : 'Скачать .md'}
      </span>
    </button>
  )
}