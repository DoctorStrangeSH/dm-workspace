'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Circle, Shield, Swords } from 'lucide-react'
import type { Token } from '@/lib/types'
import { tokenArtSrc } from '@/lib/maps/token-art'

export default function CombatPortrait({ token, size = 48 }: { token: Token; size?: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const imageSrc = tokenArtSrc(token)
  const Icon = token.character_id ? Shield : token.entity_id ? Swords : Circle
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-[var(--bg-app)] text-[var(--text-secondary)]"
      style={{ width: size, height: size, borderColor: token.color }}
      aria-hidden="true"
    >
      {imageSrc && failedSrc !== imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="h-full w-full object-contain"
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <Icon size={Math.round(size * 0.45)} />
      )}
    </span>
  )
}
