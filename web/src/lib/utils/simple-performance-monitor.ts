/**
 * Simple performance monitoring for podcast operations
 * Tracks basic metrics without complex analytics or storage
 */
export class SimplePerformanceMonitor {
    private metrics = new Map<string, PerformanceMetric>();

    /**
     * Start timing an operation
     */
    startTimer(operationName: string): string {
        const timerId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.metrics.set(timerId, {
            operation: operationName,
            startTime: Date.now(),
            endTime: null,
            duration: null,
            success: null,
            error: null
        });

        return timerId;
    }

    /**
     * End timing an operation
     */
    endTimer(timerId: string, success: boolean = true, error?: Error): number {
        const metric = this.metrics.get(timerId);
        if (!metric) {
            console.warn(`Timer ${timerId} not found`);
            return 0;
        }

        const endTime = Date.now();
        const duration = endTime - metric.startTime;

        metric.endTime = endTime;
        metric.duration = duration;
        metric.success = success;
        metric.error = error?.message || null;

        // Log performance for debugging
        if (duration > 5000) { // Log slow operations (>5s)
            console.warn(`Slow operation detected: ${metric.operation} took ${duration}ms`);
        }

        // Clean up old metrics to prevent memory leaks
        this.cleanupOldMetrics();

        return duration;
    }

    /**
     * Get basic performance statistics
     */
    getStats(): PerformanceStats {
        const completedMetrics = Array.from(this.metrics.values())
            .filter(m => m.duration !== null);

        if (completedMetrics.length === 0) {
            return {
                totalOperations: 0,
                averageDuration: 0,
                slowOperations: 0,
                errorRate: 0,
                operationBreakdown: {}
            };
        }

        const operationBreakdown: Record<string, OperationStats> = {};
        let totalDuration = 0;
        let slowCount = 0;
        let errorCount = 0;

        completedMetrics.forEach(metric => {
            totalDuration += metric.duration!;

            if (metric.duration! > 5000) slowCount++;
            if (!metric.success) errorCount++;

            if (!operationBreakdown[metric.operation]) {
                operationBreakdown[metric.operation] = {
                    count: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                    errors: 0
                };
            }

            const opStats = operationBreakdown[metric.operation];
            opStats.count++;
            opStats.totalDuration += metric.duration!;
            opStats.averageDuration = opStats.totalDuration / opStats.count;
            if (!metric.success) opStats.errors++;
        });

        return {
            totalOperations: completedMetrics.length,
            averageDuration: totalDuration / completedMetrics.length,
            slowOperations: slowCount,
            errorRate: errorCount / completedMetrics.length,
            operationBreakdown
        };
    }

    /**
     * Log a simple event for debugging
     */
    logEvent(event: string, data?: any): void {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${event}`, data);
        }
    }

    /**
     * Clear all metrics
     */
    clearMetrics(): void {
        this.metrics.clear();
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    private cleanupOldMetrics(): void {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        for (const [timerId, metric] of this.metrics.entries()) {
            if (metric.startTime < oneHourAgo) {
                this.metrics.delete(timerId);
            }
        }
    }
}

/**
 * Interfaces for type safety
 */
interface PerformanceMetric {
    operation: string;
    startTime: number;
    endTime: number | null;
    duration: number | null;
    success: boolean | null;
    error: string | null;
}

export interface PerformanceStats {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    errorRate: number;
    operationBreakdown: Record<string, OperationStats>;
}

interface OperationStats {
    count: number;
    totalDuration: number;
    averageDuration: number;
    errors: number;
}

// Export singleton instance
export const performanceMonitor = new SimplePerformanceMonitor();