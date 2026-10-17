import { Skeleton, ChapterItemSkeleton } from '@/components/skeleton'

export default function ChaptersLoading() {
  return (
    <div className="max-w-4xl">
      {/* Заголовок + кнопка */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Skeleton width="150px" height="28px" />
          <Skeleton width="80px" height="14px" />
        </div>
        <Skeleton width="140px" height="40px" rounded="lg" />
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <Skeleton height="42px" rounded="lg" />
      </div>

      {/* Список */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <ChapterItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}