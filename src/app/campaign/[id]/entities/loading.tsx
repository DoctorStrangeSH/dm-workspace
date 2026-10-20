import { Skeleton, EntityCardSkeleton } from '@/components/skeleton'

export default function EntitiesLoading() {
  return (
    <div className="max-w-6xl">
      {/* Заголовок + кнопка */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton width="180px" height="28px" />
          <Skeleton width="100px" height="14px" />
        </div>
        <Skeleton width="160px" height="40px" rounded="lg" />
      </div>

      {/* Фильтры */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} width="90px" height="32px" rounded="lg" />
        ))}
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <EntityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
