'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseCreditResult {
  success: boolean
  creditsRemaining?: number
  creditsDeducted?: number
  error?: string
}

export function useCredits() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const checkCredits = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/users/credits')
      if (!response.ok) {
        throw new Error('Failed to fetch credits')
      }
      const data = await response.json()
      return data.credits
    } catch (error) {
      console.error('Error checking credits:', error)
      throw error
    }
  }, [])

  const useCredits = useCallback(async (
    action: string, 
    credits: number = 1, 
    resourceId?: string
  ): Promise<UseCreditResult> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          credits,
          resourceId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          // Insufficient credits - redirect to credits page
          router.push('/credits?reason=insufficient')
          return {
            success: false,
            error: 'Insufficient credits'
          }
        }
        throw new Error(data.error || 'Failed to use credits')
      }

      return {
        success: true,
        creditsRemaining: data.creditsRemaining,
        creditsDeducted: data.creditsDeducted
      }
    } catch (error) {
      console.error('Error using credits:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process credit usage'
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const checkAndProceed = useCallback(async (
    requiredCredits: number = 1,
    onProceed: () => Promise<void> | void
  ): Promise<void> => {
    try {
      const currentCredits = await checkCredits()
      
      if (currentCredits < requiredCredits) {
        router.push(`/credits?reason=insufficient&required=${requiredCredits}`)
        return
      }

      await onProceed()
    } catch (error) {
      console.error('Error in credit check and proceed:', error)
    }
  }, [checkCredits, router])

  return {
    isLoading,
    checkCredits,
    useCredits,
    checkAndProceed
  }
}
