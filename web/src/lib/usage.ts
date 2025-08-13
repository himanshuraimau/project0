import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { RateLimiterPrisma } from "rate-limiter-flexible";

// Export constants for consistent use across the application
export const FREE_POINTS = 5;
export const DURATION = 30 * 24 * 60 * 60; //30 Days
export const GENERATION_COST = 1;
export const PRO_PLAN_NAME = 'pro';

/**
 * Checks if the current user has a pro subscription using Clerk's has() method
 * @returns Promise<boolean> true if user has pro plan, false otherwise
 */
async function userHasProPlan() {
    try {
        const { has } = await auth();
        return has({ plan: 'pro' });
    } catch (error) {
        console.error('Error checking pro plan status:', error);
        return false;
    }
}

export async function getUsageTracker(){
    // Create a new usage tracker with consistent FREE_POINTS value
    const usageTracker = new RateLimiterPrisma({
        storeClient: prisma,
        tableName: "Usage",
        points: FREE_POINTS, // Using the exported constant
        duration: DURATION
    });

    return usageTracker;
};


export async function consumeCredits(){
    const { userId } = await auth();

    if(!userId){
        throw new Error("User not authenticated");
    }

    // Check if user has Pro subscription using our helper function
    if (await userHasProPlan()) {
        // Pro users don't consume credits - they have unlimited usage
        return {
            remainingPoints: Infinity,  // Indicate unlimited points
            consumedPoints: 0,
            isFirstInDuration: false,
            msBeforeNext: 0
        };
    }

    const usageTracker = await getUsageTracker();
    const result = await usageTracker.consume(userId, GENERATION_COST);
    return result;
};


export async function getUsageStatus(){
    const { userId } = await auth();

    if(!userId){
        throw new Error("User not authenticated");
    }

    // Check if user has pro plan
    const isPro = await userHasProPlan();
    
    if (isPro) {
        // Return unlimited usage status for pro users
        return {
            remainingPoints: Infinity,
            consumedPoints: 0,
            isProUser: true
        };
    }
    
    // For free users, return their actual usage
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.get(userId);
    
    return {
        ...result,
        isProUser: false
    };
};

export async function checkUserHasCredits(){
    const { userId } = await auth();

    if(!userId){
        throw new Error("User not authenticated");
    }
    
    // Check if user has Pro subscription using our helper function
    if (await userHasProPlan()) {
        return true; // Pro users always have credits
    }

    try {
        const usageTracker = await getUsageTracker();
        const result = await usageTracker.get(userId);
        
        // If user is found and has points remaining, they have credits
        return result ? result.remainingPoints > 0 : true; // New users have credits
    } catch (error) {
        // If there's an error or user not found, assume they have credits (new user)
        return true;
    }
};

/**
 * Gets the current user's subscription plan
 * @returns Promise<string> The name of the subscription plan (e.g., 'free', 'pro')
 */
export async function getUserSubscriptionPlan() {
    try {
        const isPro = await userHasProPlan();
        return isPro ? 'pro' : 'free';
    } catch (error) {
        console.error('Error getting subscription plan:', error);
        return 'free'; // Default to free if there's an error
    }
}

/**
 * Gets the user's remaining points using the same RateLimiterPrisma logic
 * This ensures consistency between credit checks and display
 */
export async function getUserRemainingPoints(): Promise<number> {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            throw new Error("User not authenticated");
        }
        
        // Check if user has Pro plan
        if (await userHasProPlan()) {
            return Infinity; // Pro users have unlimited points
        }
        
        // Use the same method as getUsageStatus to ensure consistency
        const usageTracker = await getUsageTracker();
        const result = await usageTracker.get(userId);
        
        // If no result (new user), return default points
        if (!result) {
            return FREE_POINTS;
        }
        
        // Return the remaining points from the rate limiter
        console.log("Debug - Rate limiter remaining points:", result.remainingPoints);
        return result.remainingPoints;
    } catch (error) {
        console.error('Error getting user points:', error);
        return FREE_POINTS; // Return the default points on error
    }
}