/**
 * Rate limiting utilities for API endpoints
 * Implements in-memory rate limiting with configurable windows and limits
 */

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
    // AI generation endpoints - more restrictive
    AI_GENERATION: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 requests per minute
    },

    // Course creation - moderate restriction
    COURSE_CREATION: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20, // 20 requests per minute
    },

    // General API - less restrictive
    GENERAL_API: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
    },
} as const;

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // If no entry exists or the window has expired, create a new one
    if (!entry || now >= entry.resetTime) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitStore.set(key, newEntry);

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: newEntry.resetTime,
        };
    }

    // Check if the limit has been exceeded
    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
        };
    }

    // Increment the count
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Create a rate limit key for a user and endpoint
 */
export function createRateLimitKey(userId: string, endpoint: string): string {
    return `${endpoint}:${userId}`;
}

/**
 * Clean up expired entries from the rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of rateLimitStore.entries()) {
        if (now >= entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
    return function rateLimitMiddleware(userId: string, endpoint: string) {
        const key = createRateLimitKey(userId, endpoint);
        const result = checkRateLimit(key, config);

        return {
            ...result,
            headers: {
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': result.remaining.toString(),
                'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
            },
        };
    };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
    aiGeneration: withRateLimit(RATE_LIMIT_CONFIGS.AI_GENERATION),
    courseCreation: withRateLimit(RATE_LIMIT_CONFIGS.COURSE_CREATION),
    generalApi: withRateLimit(RATE_LIMIT_CONFIGS.GENERAL_API),
};

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}