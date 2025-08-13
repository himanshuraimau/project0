"use client"

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { CreditCard } from 'lucide-react'
import { UpgradeCreditButton } from '@/components/ui/upgrade-credit-button'

interface CreditStatusProps {
  className?: string
  variant?: 'default' | 'compact'
}

interface CreditInfo {
  total: number
  used: number
  remaining: number
  isPro: boolean
}

export function CreditStatus({ className, variant = 'default' }: CreditStatusProps) {
  const [credits, setCredits] = useState<CreditInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/credits/status')
        
        if (!response.ok) {
          throw new Error('Failed to load credit status')
        }
        
        const data = await response.json()
        if (data.success && data.credits) {
          console.log('Debug - CreditStatus component received:', {
            total: data.credits.total,
            used: data.credits.used,
            remaining: data.credits.remaining,
            isPro: data.credits.isPro
          })
          setCredits(data.credits)
        } else {
          throw new Error(data.message || 'Unknown error')
        }
      } catch (err) {
        console.error('Error fetching credits:', err)
        setError(err instanceof Error ? err.message : 'Failed to load credits')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCredits()
    
    // Refresh credits every 5 minutes
    const interval = setInterval(fetchCredits, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
      </div>
    )
  }
  
  if (error || !credits) {
    return null // Hide component on error
  }
  
  // Display for pro users with unlimited credits
  if (credits.isPro) {
    return (
      <div className={cn("p-4 space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>Pro Plan</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Unlimited credits
        </div>
      </div>
    )
  }
  
  // Calculate percentage of credits used
  const percentRemaining = Math.min(Math.max((credits.used / credits.total) * 100, 0), 100)
  
  // Display for free users with limited credits
  if (variant === 'compact') {
    return (
      <div className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-medium">Credits</div>
          <div className="text-xs">
            {Number.isFinite(credits.used) ? Math.max(0, credits.used) : '∞'}/{Number.isFinite(credits.total) ? credits.total : '∞'}
          </div>
        </div>
        <Progress value={percentRemaining} className="h-1.5" />
        <div className="mt-2">
          <UpgradeCreditButton compact />
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("p-4 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>Credits</span>
        </div>
        <div className="text-sm">
          {Number.isFinite(credits.used) ? Math.max(0, credits.used) : '∞'}/{Number.isFinite(credits.total) ? credits.total : '∞'}
          &nbsp;used
        </div>
      </div>
      <Progress value={percentRemaining} className="h-2" />
      <div className="text-xs text-muted-foreground">
        {credits.remaining > 0 
          ? `${Number.isFinite(credits.remaining) ? Math.max(0, credits.remaining) : 'Unlimited'} credits remaining` 
          : "No credits remaining"}
      </div>
      <UpgradeCreditButton />
    </div>
  )
}
