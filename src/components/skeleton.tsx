'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  width?: string
  height?: string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className,
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  return (
    <div
      className={cn('skeleton-shimmer', roundedClasses[rounded], className)}
      style={{ width, height }}
      aria-hidden
    />
  )
}

// ============================================================
// Готовые skeleton-композиции
// ============================================================

export function ChapterItemSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton width="18px" height="18px" rounded="sm" />
        <Skeleton width="18px" height="18px" rounded="sm" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="14px" />
          <Skeleton width="30%" height="12px" />
        </div>
      </div>
    </div>
  )
}

export function EntityCardSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Skeleton width="40px" height="40px" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height="16px" />
          <Skeleton width="40%" height="12px" />
          <Skeleton width="90%" height="12px" />
          <Skeleton width="50%" height="12px" />
        </div>
      </div>
    </div>
  )
}

export function CampaignCardSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <Skeleton width="70%" height="20px" className="mb-2" />
      <Skeleton width="40%" height="12px" className="mb-4" />
      <Skeleton width="100%" height="12px" className="mb-1" />
      <Skeleton width="80%" height="12px" className="mb-4" />
      <Skeleton width="100%" height="36px" rounded="lg" />
    </div>
  )
}

export function ChapterEditorSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <Skeleton width="180px" height="32px" rounded="lg" />
        <Skeleton width="120px" height="20px" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 h-[700px] space-y-3">
          <Skeleton width="80%" height="20px" />
          <Skeleton width="100%" height="14px" />
          <Skeleton width="90%" height="14px" />
          <Skeleton width="95%" height="14px" />
          <Skeleton width="60%" height="14px" />
          <div className="h-4" />
          <Skeleton width="70%" height="14px" />
          <Skeleton width="85%" height="14px" />
          <Skeleton width="100%" height="14px" />
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 h-[700px] space-y-3">
          <Skeleton width="70%" height="24px" />
          <Skeleton width="100%" height="14px" />
          <Skeleton width="90%" height="14px" />
          <Skeleton width="95%" height="14px" />
        </div>
      </div>
    </div>
  )
}

export function EntityDetailSkeleton() {
  return (
    <div>
      <Skeleton width="250px" height="14px" className="mb-6" />

      <div className="flex items-start gap-4 mb-6">
        <Skeleton width="56px" height="56px" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="100px" height="12px" />
          <Skeleton width="60%" height="28px" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
        <Skeleton width="120px" height="32px" rounded="lg" />
        <Skeleton width="140px" height="32px" rounded="lg" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
        <Skeleton width="100%" height="14px" />
        <Skeleton width="90%" height="14px" />
        <Skeleton width="80%" height="14px" />
      </div>

      <div className="mt-6 space-y-3">
        <Skeleton width="200px" height="20px" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton height="40px" rounded="lg" />
          <Skeleton height="40px" rounded="lg" />
          <Skeleton height="40px" rounded="lg" />
          <Skeleton height="40px" rounded="lg" />
        </div>
      </div>
    </div>
  )
}