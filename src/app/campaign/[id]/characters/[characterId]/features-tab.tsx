'use client'

import EmptyState from '@/components/empty-state'

export default function FeaturesTab() {
  return (
    <EmptyState
      icon="⭐"
      title="Особенности"
      description="Скоро: особенности класса, черты и способности. В разработке."
      size="md"
      dashed={false}
    />
  )
}