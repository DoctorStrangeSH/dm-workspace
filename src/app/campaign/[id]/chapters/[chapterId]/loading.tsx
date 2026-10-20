import { Skeleton, ChapterEditorSkeleton } from '@/components/skeleton'

export default function ChapterEditorLoading() {
  return (
    <div className="max-w-6xl">
      {/* Хлебные крошки */}
      <Skeleton width="180px" height="14px" className="mb-3" />

      {/* Заголовок */}
      <div className="mb-6 space-y-2">
        <Skeleton width="50%" height="28px" />
        <Skeleton width="200px" height="12px" />
      </div>

      {/* Редактор */}
      <ChapterEditorSkeleton />
    </div>
  )
}
