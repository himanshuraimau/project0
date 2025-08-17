import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export interface CreditPlan {
  id: string
  name: string
  credits: number
  price: number
  description: string
  productId: string
}

export const CREDIT_PLANS: CreditPlan[] = [
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
    price: 1000, // $10.00 in cents
    description: 'Best for regular users',
    productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || 'pdt_ncCa7erBoNtO9GunYcJL3'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    credits: 500,
    price: 4000, // $40.00 in cents
    description: 'For teams and heavy usage',
    productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE || 'pdt_VJWdaLBqdd6pcy67TXlJ6'
  }
]

export class UserService {
  /**
   * Get or create a user in our database
   */
  static async getOrCreateUser(userId: string, email?: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: email,
            creditBalance: 10 // Free credits for new users
          }
        })
      }

      return user
    } catch (error) {
      console.error('Error getting or creating user:', error)
      throw new Error('Failed to get or create user')
    }
  }

  /**
   * Get current user's credit balance
   */
  static async getCurrentUserCredits() {
    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    const user = await this.getOrCreateUser(userId)
    return user.creditBalance
  }

  /**
   * Check if user has enough credits for an action
   */
  static async hasEnoughCredits(requiredCredits: number = 1) {
    const balance = await this.getCurrentUserCredits()
    return balance >= requiredCredits
  }

  /**
   * Deduct credits from user's balance
   */
  static async deductCredits(
    action: string,
    creditsToDeduct: number = 1,
    resourceId?: string
  ) {
    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    const user = await this.getOrCreateUser(userId)

    if (user.creditBalance < creditsToDeduct) {
      throw new Error('Insufficient credits')
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits from user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            decrement: creditsToDeduct
          }
        }
      })

      // Record credit usage
      await tx.creditUsage.create({
        data: {
          userId,
          action,
          credits: creditsToDeduct,
          resourceId
        }
      })

      return updatedUser
    })

    return result
  }

  /**
   * Add credits to user's balance (after successful payment)
   */
  static async addCredits(userId: string, creditsToAdd: number) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            increment: creditsToAdd
          }
        }
      })

      return updatedUser
    } catch (error) {
      console.error('Error adding credits:', error)
      throw new Error('Failed to add credits')
    }
  }

  /**
   * Get user's purchase history
   */
  static async getUserPurchases() {
    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    return await prisma.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Get user's credit usage history
   */
  static async getUserCreditUsage() {
    const { userId } = await auth()
    if (!userId) throw new Error('User not authenticated')

    return await prisma.creditUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 usages
    })
  }

  /**
   * Create a purchase record
   */
  static async createPurchase(
    userId: string,
    plan: CreditPlan,
    dodoPaymentId?: string
  ) {
    try {
      return await prisma.purchase.create({
        data: {
          userId,
          plan: plan.id,
          credits: plan.credits,
          amountPaid: plan.price,
          dodoPaymentId,
          status: 'pending'
        }
      })
    } catch (error) {
      console.error('Error creating purchase:', error)
      throw new Error('Failed to create purchase record')
    }
  }

  /**
   * Complete a purchase (called from webhook)
   */
  static async completePurchase(dodoPaymentId: string) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { dodoPaymentId }
      })

      if (!purchase) {
        throw new Error('Purchase not found')
      }

      if (purchase.status === 'completed') {
        return purchase // Already completed
      }

      // Update purchase status and add credits to user
      const result = await prisma.$transaction(async (tx) => {
        // Update purchase status
        const updatedPurchase = await tx.purchase.update({
          where: { dodoPaymentId },
          data: { status: 'completed' }
        })

        // Add credits to user
        await tx.user.update({
          where: { id: purchase.userId },
          data: {
            creditBalance: {
              increment: purchase.credits
            }
          }
        })

        return updatedPurchase
      })

      return result
    } catch (error) {
      console.error('Error completing purchase:', error)
      throw new Error('Failed to complete purchase')
    }
  }

  /**
   * Get credit plan by ID
   */
  static getCreditPlan(planId: string): CreditPlan | undefined {
    return CREDIT_PLANS.find(plan => plan.id === planId)
  }

  /**
   * Get credit plan by product ID
   */
  static getCreditPlanByProductId(productId: string): CreditPlan | undefined {
    return CREDIT_PLANS.find(plan => plan.productId === productId)
  }

  /**
   * Format price for display
   */
  static formatPrice(priceInCents: number): string {
    return `$${(priceInCents / 100).toFixed(2)}`
  }

  /**
   * Get credits per dollar for a plan
   */
  static getCreditsPerDollar(plan: CreditPlan): number {
    return plan.credits / (plan.price / 100)
  }
}
