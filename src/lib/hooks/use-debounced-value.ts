'use client'

import { useState, useEffect } from 'react'

/**
 * Возвращает значение, обновляемое не чаще, чем раз в delay мс.
 * Полезно для поиска — не фильтруем на каждое нажатие.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}