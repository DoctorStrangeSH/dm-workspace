'use client'

import { EmptyState } from '@/components/ui'
import { useT } from '@/lib/i18n'

export default function FeaturesTab() {
  const t = useT()

  return (
    <EmptyState
      icon="⭐"
      title={t('characters.features.title')}
      description={t('characters.features.description')}
      size="md"
      dashed={false}
    />
  )
}
