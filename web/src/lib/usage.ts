import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { RateLimiterPrisma } from "rate-limiter-flexible";

const FREE_POINTS = 5;
const DURATION = 30 * 24 * 60 * 60; //30 Days
const GENERATION_COST = 1;

export async function getUsageTracker(){
    const usageTracker = new RateLimiterPrisma({
        storeClient: prisma,
        tableName: "Usage",
        points: FREE_POINTS,
        duration: DURATION
    });

    return usageTracker;
};


export async function consumeCredits(){
    const { userId } = await auth();

    if(!userId){
        throw new Error("User not authenticated");
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

    const usageTracker = await getUsageTracker();
    const result = await usageTracker.get(userId);
    return result;
};

export async function checkUserHasCredits(){
    const { userId } = await auth();

    if(!userId){
        throw new Error("User not authenticated");
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