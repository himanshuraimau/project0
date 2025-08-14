"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { SubscriptionStatus } from '@/lib/types'



export function useSubscriptionStatus(): SubscriptionStatus {
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<SubscriptionStatus>({
    isPro: false,
    loading: true,
    error: null
  })

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!isLoaded || !user) {
        return
      }
      
      try {
        // First, check Clerk metadata (faster, but might not be in sync with backend)
        const hasPro = user.publicMetadata?.subscriptionTier === "pro"
        
        if (hasPro) {
          setStatus({
            isPro: true,
            loading: false,
            error: null
          })
          return
        }
        
        // If not found in metadata, check with the backend
        const response = await fetch('/api/credits/status')
        
        if (!response.ok) {
          throw new Error('Failed to load subscription status')
        }
        
        const data = await response.json()
        if (data.success && data.credits) {
          setStatus({
            isPro: !!data.credits.isPro,
            loading: false,
            error: null
          })
        } else {
          throw new Error(data.message || 'Unknown error')
        }
      } catch (err) {
        console.error('Error checking subscription status:', err)
        setStatus({
          isPro: false, 
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to check subscription status'
        })
      }
    }
    
    checkSubscriptionStatus()
  }, [user, isLoaded])

  return status
}
