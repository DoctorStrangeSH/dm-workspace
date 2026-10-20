'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

const SIDE_CLASSES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1 text-xs whitespace-nowrap text-[var(--text-primary)] shadow-[var(--shadow-md)]',
            SIDE_CLASSES[side]
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
