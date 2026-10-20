import { EntityDetailSkeleton } from '@/components/skeleton'

export default function EntityDetailLoading() {
  return (
    <div className="max-w-3xl">
      <EntityDetailSkeleton />
    </div>
  )
}
