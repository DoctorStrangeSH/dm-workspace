import { Skeleton, CampaignCardSkeleton } from '@/components/ui'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      {/* Шапка */}
      <header className="border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Hero — повторяет геометрию обновлённого дашборда */}
        <div className="mb-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-primary)] p-5 sm:p-8">
          <Skeleton width="190px" height="12px" />
          <div className="mt-4">
            <Skeleton width="min(420px, 80%)" height="36px" />
          </div>
          <div className="mt-3">
            <Skeleton width="min(520px, 90%)" height="16px" />
          </div>
        </div>

        {/* Заголовок */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton width="200px" height="28px" />
            <Skeleton width="100px" height="14px" />
          </div>
          <Skeleton width="160px" height="40px" rounded="lg" />
        </div>

        {/* Сетка кампаний */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
