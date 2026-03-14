'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, CreditCardIcon, ZapIcon } from 'lucide-react'

interface CreditPlan {
  id: string
  name: string
  credits: number
  price: number
  description: string
  productId: string
}

const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    credits: 10,
    price: 0, // Free
    description: 'Get started with 10 free credits',
    productId: '' // No product ID for free plan
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    credits: 100,
    price: 1999, // $19.99 in cents
    description: 'Best for regular users',
    productId: process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || ''
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    credits: 500,
    price: 9999, // $99.99 in cents
    description: 'For teams and heavy usage',
    productId: ''
  }
]

interface CreditPurchaseProps {
  currentCredits?: number
  onPurchaseSuccess?: () => void
}

export function CreditPurchase({ currentCredits = 0 }: CreditPurchaseProps) {
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async (plan: CreditPlan) => {
    if (plan.id === 'free') return // Free plan doesn't need purchase
    
    setIsLoading(true)
    setSelectedPlan(plan)

    try {
      // Redirect to checkout with the selected product
      const checkoutUrl = `/checkout?productId=${plan.productId}&quantity=1`
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error initiating purchase:', error)
      setIsLoading(false)
      setSelectedPlan(null)
    }
  }

  const formatPrice = (priceInCents: number): string => {
    return `$${(priceInCents / 100).toFixed(2)}`
  }

  const getCreditsPerDollar = (plan: CreditPlan) => {
    if (plan.price === 0) return 0
    return Math.round((plan.credits / (plan.price / 100)) * 10) / 10
  }

  const isPopular = (plan: CreditPlan) => plan.id === 'pro'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Choose Your Credit Plan
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Purchase credits to create notes, quizzes, and flashcards
        </p>
        <div className="flex items-center justify-center gap-2 text-lg">
          <ZapIcon className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">Current Balance: {currentCredits} credits</span>
        </div>
      </div>

      {/* Credit Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {CREDIT_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 hover: ${
              isPopular(plan) ? 'border-primary  scale-105' : ''
            } ${selectedPlan?.id === plan.id && isLoading ? 'opacity-75' : ''}`}
          >
            {isPopular(plan) && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">
                  {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
                </div>
                {plan.price > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ${(plan.price / 100 / plan.credits).toFixed(3)} per credit
                  </div>
                )}
              </div>

              {/* Credits */}
              <div className="text-center">
                <div className="text-2xl font-semibold text-primary">
                  {plan.credits} Credits
                </div>
                {plan.price > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {getCreditsPerDollar(plan)} credits per dollar
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 shrink-0" />
                  <span>Create {plan.credits} notes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 shrink-0" />
                  <span>Generate {plan.credits} quizzes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 shrink-0" />
                  <span>Create {plan.credits} flashcard sets</span>
                </div>
                {plan.id === 'enterprise' && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Priority support</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handlePurchase(plan)}
                disabled={isLoading || plan.id === 'free'}
                className={`w-full ${
                  isPopular(plan) ? 'bg-primary hover:bg-primary/90' : ''
                }`}
                variant={plan.id === 'free' ? 'outline' : 'default'}
              >
                {isLoading && selectedPlan?.id === plan.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Redirecting...
                  </div>
                ) : plan.id === 'free' ? (
                  'Current Plan'
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Purchase Now
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-center">What can you do with credits?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-primary mb-2">1 Credit</div>
            <div className="text-sm text-muted-foreground">Upload and process one PDF document</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">1 Credit</div>
            <div className="text-sm text-muted-foreground">Generate a comprehensive note from your document</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary mb-2">1 Credit</div>
            <div className="text-sm text-muted-foreground">Create a quiz or flashcard set</div>
          </div>
        </div>
      </div>
    </div>
  )
}
