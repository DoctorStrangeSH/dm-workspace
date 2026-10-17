import {
  Skeleton,
  CampaignCardSkeleton,
} from '@/components/skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      {/* Шапка */}
      <header className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <div className="space-y-1">
            <Skeleton width="140px" height="20px" />
            <Skeleton width="80px" height="12px" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width="32px" height="32px" rounded="lg" />
            <Skeleton width="80px" height="32px" rounded="lg" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
          <div className="space-y-2">
            <Skeleton width="200px" height="28px" />
            <Skeleton width="100px" height="14px" />
          </div>
          <Skeleton width="160px" height="40px" rounded="lg" />
        </div>

        {/* Сетка кампаний */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}