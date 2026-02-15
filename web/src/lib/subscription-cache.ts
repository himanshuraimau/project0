/**
 * Subscription Cache - Centralized subscription data caching with request deduplication
 * 
 * This prevents multiple components from making duplicate API calls to /api/subscription/status
 * by caching the response and deduplicating in-flight requests.
 */

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: any;
  access: any;
  features: any;
}

interface CacheEntry {
  data: SubscriptionStatus;
  timestamp: number;
}

class SubscriptionCache {
  private cache: CacheEntry | null = null;
  private pendingRequest: Promise<SubscriptionStatus> | null = null;
  private cacheTimeout = 30000; // 30 seconds
  private listeners: Set<(data: SubscriptionStatus) => void> = new Set();

  /**
   * Get subscription status with caching and request deduplication
   */
  async getStatus(forceRefresh = false): Promise<SubscriptionStatus> {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      return this.cache.data;
    }

    // If there's already a pending request, wait for it instead of creating a new one
    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    // Create new request
    this.pendingRequest = this.fetchStatus();

    try {
      const data = await this.pendingRequest;
      this.cache = {
        data,
        timestamp: Date.now(),
      };
      this.notifyListeners(data);
      return data;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Fetch subscription status from API
   */
  private async fetchStatus(): Promise<SubscriptionStatus> {
    const response = await fetch('/api/subscription/status', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.cacheTimeout;
  }

  /**
   * Invalidate cache and optionally fetch fresh data
   */
  async invalidate(refetch = false): Promise<SubscriptionStatus | null> {
    this.cache = null;
    if (refetch) {
      return this.getStatus(true);
    }
    return null;
  }

  /**
   * Subscribe to cache updates
   */
  subscribe(listener: (data: SubscriptionStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of cache update
   */
  private notifyListeners(data: SubscriptionStatus): void {
    this.listeners.forEach((listener) => listener(data));
  }

  /**
   * Set cache timeout (in milliseconds)
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  /**
   * Get current cache data without fetching
   */
  getCached(): SubscriptionStatus | null {
    return this.cache?.data ?? null;
  }
}

// Export singleton instance
export const subscriptionCache = new SubscriptionCache();

// Export batch fetch utility
export async function batchFetchSubscription(): Promise<SubscriptionStatus> {
  return subscriptionCache.getStatus();
}
