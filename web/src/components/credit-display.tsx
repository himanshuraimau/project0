'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ZapIcon, CreditCardIcon, AlertTriangleIcon } from 'lucide-react'
import Link from 'next/link'

interface CreditDisplayProps {
  initialCredits?: number
  showPurchaseButton?: boolean
}

export function CreditDisplay({ initialCredits = 0, showPurchaseButton = true }: CreditDisplayProps) {
  const [credits, setCredits] = useState(initialCredits)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch current credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/users/credits')
        if (response.ok) {
          const data = await response.json()
          setCredits(data.credits)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredits()
  }, [])

  const isLowCredits = credits <= 5
  const isOutOfCredits = credits <= 0

  return (
    <Card className={`${isLowCredits ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isLowCredits ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-primary/10'}`}>
              {isLowCredits ? (
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <ZapIcon className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {isLoading ? '...' : credits} Credits
                </span>
                {isLowCredits && !isOutOfCredits && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    Low balance
                  </span>
                )}
                {isOutOfCredits && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    No credits
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {isOutOfCredits
                  ? 'Purchase credits to continue'
                  : isLowCredits
                  ? 'Consider purchasing more credits'
                  : 'Available for notes, quizzes & flashcards'
                }
              </div>
            </div>
          </div>

          {showPurchaseButton && (
            <Button asChild size="sm" variant={isLowCredits ? 'default' : 'outline'}>
              <Link href="/credits" className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4" />
                {isOutOfCredits ? 'Buy Credits' : 'Top Up'}
              </Link>
            </Button>
          )}
        </div>

        {isLowCredits && (
          <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {isOutOfCredits
                ? 'You need credits to create notes, quizzes, and flashcards.'
                : `You have ${credits} credit${credits === 1 ? '' : 's'} remaining. Each action (creating notes, quizzes, or flashcards) uses 1 credit.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
