'use client'

/**
 * Helper function to check and deduct credits for user actions
 */
export async function useCredits(action: string, credits: number = 1, resourceId?: string) {
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
        // Insufficient credits
        throw new Error('INSUFFICIENT_CREDITS')
      }
      throw new Error(data.error || 'Failed to use credits')
    }

    return {
      success: true,
      creditsRemaining: data.creditsRemaining,
      creditsDeducted: data.creditsDeducted
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      throw error
    }
    console.error('Error using credits:', error)
    throw new Error('Failed to process credit usage')
  }
}

/**
 * Helper function to get current credit balance
 */
export async function getCurrentCredits() {
  try {
    const response = await fetch('/api/users/credits')
    
    if (!response.ok) {
      throw new Error('Failed to fetch credits')
    }

    const data = await response.json()
    return data.credits
  } catch (error) {
    console.error('Error fetching credits:', error)
    throw error
  }
}

/**
 * Helper function to handle insufficient credits
 */
export function handleInsufficientCredits() {
  // Redirect to credits page with a reason
  window.location.href = '/credits?reason=insufficient'
}
