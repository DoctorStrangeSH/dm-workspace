import { Skeleton } from '@/components/ui'

export default function CampaignLoading() {
  return (
    <div className="max-w-4xl">
      {/* Заголовок */}
      <div className="mb-8 space-y-3">
        <Skeleton width="40%" height="36px" />
        <Skeleton width="120px" height="20px" rounded="full" />
        <Skeleton width="100%" height="14px" />
      </div>

      {/* Статистика */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height="100px" rounded="lg" />
        ))}
      </div>
    </div>
  )
}
