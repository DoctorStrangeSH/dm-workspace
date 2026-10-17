'use client'

import EmptyState from '@/components/empty-state'

interface Props {
  characterId: string
  campaignId: string
  canEdit: boolean
}

export default function FeaturesTab() {
  return (
    <EmptyState
      icon="⭐"
      title="Особенности"
      description="Скоро: особенности класса, черты и способности. Сейчас в разработке."
      size="md"
      dashed={false}
    />
  )
}