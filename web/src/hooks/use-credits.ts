'use client'

import { useState, useCallback } from 'react'
import { useUpgradeModal } from '@/contexts/upgrade-modal-context'

interface UseCreditResult {
  success: boolean
  hasAccess?: boolean
  error?: string
}

/**
 * Hook for checking subscription access (formerly credits)
 * Now checks subscription status instead of credit balance
 */
export function useCredits() {
  const [isLoading, setIsLoading] = useState(false)
  const { openUpgradeModal } = useUpgradeModal()

  /**
   * Check if user has active subscription
   * @deprecated Use useSubscription hook instead
   */
  const checkCredits = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/subscription/status')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }
      const data = await response.json()
      
      // Return a high number if user has subscription, 0 if not
      // This maintains backward compatibility with credit-checking code
      return data.access?.hasAccess ? 999999 : 0
    } catch (error) {
      console.error('Error checking subscription:', error)
      return 0 // No access on error
    }
  }, [])

  /**
   * Check if user has subscription access (replaces credit deduction)
   * @deprecated Use useSubscription hook instead
   */
  const useCredits = useCallback(async (
    action: string, 
    credits: number = 1, 
    resourceId?: string
  ): Promise<UseCreditResult> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/status')

      if (!response.ok) {
        throw new Error('Failed to check subscription status')
      }

      const data = await response.json()

      // Check if user has access
      if (!data.access?.hasAccess) {
        // No subscription - show upgrade modal
        openUpgradeModal()
        return {
          success: false,
          hasAccess: false,
          error: 'Active subscription required'
        }
      }

      // User has access
      return {
        success: true,
        hasAccess: true
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      return {
        success: false,
        hasAccess: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription'
      }
    } finally {
      setIsLoading(false)
    }
  }, [openUpgradeModal])

  /**
   * Check subscription and proceed if active
   * @deprecated Use useSubscription hook instead
   */
  const checkAndProceed = useCallback(async (
    requiredCredits: number = 1,
    onProceed: () => Promise<void> | void
  ): Promise<void> => {
    try {
      const hasAccess = await checkCredits()
      
      if (hasAccess === 0) {
        // No subscription - show upgrade modal
        openUpgradeModal()
        return
      }

      // User has subscription, proceed
      await onProceed()
    } catch (error) {
      console.error('Error in subscription check and proceed:', error)
      openUpgradeModal()
    }
  }, [checkCredits, openUpgradeModal])

  return {
    isLoading,
    checkCredits,
    useCredits,
    checkAndProceed
  }
}
