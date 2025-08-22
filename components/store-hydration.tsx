'use client'

import { useEffect, useState } from 'react'
import { useFilterStore } from '@/lib/store'

export function StoreHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const hydrateStore = async () => {
      // Wait for store to be ready
      await Promise.resolve()
      
      // Rehydrate the store
      await useFilterStore.persist.rehydrate()
      
      setIsHydrated(true)
    }

    hydrateStore()
  }, [])

  return null
} 