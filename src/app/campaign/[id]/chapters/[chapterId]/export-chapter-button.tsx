'use client'

import { useState, useTransition } from 'react'
import { Download, Check } from 'lucide-react'
import { getChapterForExport } from '@/lib/actions/export'
import { formatChapterAsMarkdown } from '@/lib/export-markdown'
import { downloadText } from '@/lib/download'
import { toFilename } from '@/lib/slugify'
import { Button } from '@/components/ui'
import { useToast } from '@/components/toast/toast-provider'
import { useT } from '@/lib/i18n'

interface Props {
  chapterId: string
  campaignId: string
  chapterTitle: string
}

export default function ExportChapterButton({ chapterId, campaignId, chapterTitle }: Props) {
  const t = useT()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleExport = () => {
    startTransition(async () => {
      const res = await getChapterForExport(chapterId, campaignId)
      if (res.error || !res.data) {
        // CHANGES: alert() → toast (правило проекта)
        toast.error(res.error ?? t('chapters.toast.exportFailed'))
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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      loading={isPending}
      icon={done ? <Check size={14} /> : <Download size={14} />}
      title={t('chapters.exportHint')}
    >
      {done ? t('chapters.exportDone') : t('chapters.export')}
    </Button>
  )
}
