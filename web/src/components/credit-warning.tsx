'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Zap } from 'lucide-react'
import Link from 'next/link'

interface CreditWarningProps {
  requiredCredits?: number
  action?: string
  onProceed?: () => void
}

export function CreditWarning({ 
  requiredCredits = 1, 
  action = 'this action',
  onProceed 
}: CreditWarningProps) {
  const [currentCredits, setCurrentCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/users/credits')
        if (response.ok) {
          const data = await response.json()
          setCurrentCredits(data.credits)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [])

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Checking credits...</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Please wait while we verify your credit balance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (currentCredits === null) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100">Unable to check credits</h4>
              <p className="text-sm text-red-700 dark:text-red-200">
                We couldn&apos;t verify your credit balance. Please try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasEnoughCredits = currentCredits >= requiredCredits
  const isLowCredits = currentCredits <= 5 && currentCredits > 0

  if (!hasEnoughCredits) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100">Insufficient Credits</h4>
                <p className="text-sm text-red-700 dark:text-red-200">
                  You need {requiredCredits} credit{requiredCredits > 1 ? 's' : ''} to perform {action}, 
                  but you only have {currentCredits} credit{currentCredits !== 1 ? 's' : ''} remaining.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/credits">
                  Purchase Credits
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLowCredits) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Low Credit Balance</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  You have {currentCredits} credit{currentCredits !== 1 ? 's' : ''} remaining. 
                  {action && ` This action will use ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''}.`}
                </p>
              </div>
              <div className="flex gap-2">
                {onProceed && (
                  <Button onClick={onProceed} variant="default" size="sm">
                    Continue
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href="/credits">
                    Buy More Credits
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // User has enough credits and not low
  return null
}
