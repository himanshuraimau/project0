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
  <Card className="border-none shadow-none bg-transparent p-0 m-0">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 sidebar-credit-display">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${isLowCredits ? '' : 'bg-primary/10'}`}>
              {isLowCredits ? (
                <AlertTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <ZapIcon className="h-4 w-4 text-primary" />
              )}
            </div>
            <span className="font-semibold text-foreground text-base">
              {isLoading ? '...' : credits}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              Credits
            </span>
          </div>
          {showPurchaseButton && (
            <Button asChild size="sm" variant={isLowCredits ? 'default' : 'outline'} className="px-2 py-1 text-xs">
              <Link href="/credits" className="flex items-center gap-1">
                <CreditCardIcon className="h-3 w-3" />
                {isOutOfCredits ? 'Buy' : 'Top Up'}
              </Link>
            </Button>
          )}
        </div>
        <div className="px-2 pb-1">
          <span className="block text-xs text-muted-foreground">
            {isOutOfCredits
              ? 'Purchase credits to continue.'
              : isLowCredits
              ? 'Low balance.'
              : 'Available for notes, quizzes & flashcards.'
            }
          </span>
        </div>
        {isLowCredits && (
          <div className="px-2 pt-1">
            <p className="text-xs text-muted-foreground">
              {isOutOfCredits
                ? 'You need credits to create notes, quizzes, and flashcards.'
                : `You have ${credits} credit${credits === 1 ? '' : 's'} remaining.`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
