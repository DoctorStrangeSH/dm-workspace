'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useDmScreen } from './use-dm-screen'

type DmScreenContextValue = ReturnType<typeof useDmScreen>

const DmScreenContext = createContext<DmScreenContextValue | null>(null)

export function DmScreenProvider({ children }: { children: ReactNode }) {
  const value = useDmScreen()
  return <DmScreenContext.Provider value={value}>{children}</DmScreenContext.Provider>
}

export function useDmScreenContext() {
  const ctx = useContext(DmScreenContext)
  if (!ctx) {
    throw new Error('useDmScreenContext must be used within DmScreenProvider')
  }
  return ctx
}
