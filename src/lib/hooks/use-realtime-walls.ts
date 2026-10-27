'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SceneWall } from '@/lib/types'

interface Options {
  sceneId: string
  campaignId: string
  initialWalls: SceneWall[]
}

export function useRealtimeWalls({ sceneId, campaignId, initialWalls }: Options) {
  const [walls, setWalls] = useState<SceneWall[]>(() => initialWalls)
  const [isReady, setIsReady] = useState(false)

  const [prevInitialWalls, setPrevInitialWalls] = useState(initialWalls)
  if (initialWalls !== prevInitialWalls) {
    setPrevInitialWalls(initialWalls)
    setWalls(initialWalls)
  }

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const setup = async () => {
      await supabase.realtime.setAuth()
      if (cancelled) return

      const channel = supabase.channel(`walls:${campaignId}`, {
        config: { private: true },
      })

      channel
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          const wall = payload.payload?.record as SceneWall | undefined
          if (!wall || wall.scene_id !== sceneId) return
          setWalls((prev) => {
            if (prev.some((w) => w.id === wall.id)) return prev
            return [...prev, wall]
          })
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          const wall = payload.payload?.old_record as { id?: string; scene_id?: string } | undefined
          if (!wall?.id || wall.scene_id !== sceneId) return
          setWalls((prev) => prev.filter((w) => w.id !== wall.id))
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          const wall = payload.payload?.record as SceneWall | undefined
          if (!wall || wall.scene_id !== sceneId) return
          setWalls((prev) => prev.map((w) => (w.id === wall.id ? wall : w)))
        })
        .subscribe((status, err) => {
          console.log('[walls realtime] status:', status, 'err:', err)
          if (!cancelled) {
            setIsReady(status === 'SUBSCRIBED')
          }
        })

      return channel
    }

    let channel: Awaited<ReturnType<typeof setup>> | null = null
    setup().then((c) => {
      if (cancelled) {
        if (c) supabase.removeChannel(c)
      } else {
        channel = c
      }
    })

    return () => {
      cancelled = true
      setIsReady(false)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [sceneId, campaignId])

  return { walls, setWalls, isReady }
}
