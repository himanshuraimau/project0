import { storageManagementService, CleanupOptions } from '../storage-management-service';
import { PodcastGenerationError } from '../types/podcast.types';

/**
 * Scheduler for automated storage cleanup operations
 * Handles periodic cleanup tasks and maintenance
 */
export class StorageCleanupScheduler {
    private cleanupIntervals: Map<string, NodeJS.Timeout> = new Map();
    private isRunning = false;

    /**
     * Starts automated cleanup scheduling
     * @param options - Cleanup configuration options
     */
    async startScheduledCleanup(options: ScheduledCleanupOptions = {}): Promise<void> {
        if (this.isRunning) {
            console.warn('Cleanup scheduler is already running');
            return;
        }

        this.isRunning = true;

        // Schedule daily cleanup of failed generations
        if (options.enableFailedGenerationCleanup !== false) {
            const failedCleanupInterval = setInterval(async () => {
                try {
                    await this.runFailedGenerationCleanup();
                } catch (error) {
                    console.error('Scheduled failed generation cleanup failed:', error);
                }
            }, options.failedGenerationInterval || 24 * 60 * 60 * 1000); // 24 hours

            this.cleanupIntervals.set('failedGenerations', failedCleanupInterval);
        }

        // Schedule hourly cleanup of temporary files
        if (options.enableTempFileCleanup !== false) {
            const tempCleanupInterval = setInterval(async () => {
                try {
                    await this.runTempFileCleanup();
                } catch (error) {
                    console.error('Scheduled temp file cleanup failed:', error);
                }
            }, options.tempFileInterval || 6 * 60 * 60 * 1000); // 6 hours

            this.cleanupIntervals.set('tempFiles', tempCleanupInterval);
        }

        // Schedule weekly cleanup of old files (if enabled)
        if (options.enableOldFileCleanup) {
            const oldFileCleanupInterval = setInterval(async () => {
                try {
                    await this.runOldFileCleanup();
                } catch (error) {
                    console.error('Scheduled old file cleanup failed:', error);
                }
            }, options.oldFileInterval || 7 * 24 * 60 * 60 * 1000); // 7 days

            this.cleanupIntervals.set('oldFiles', oldFileCleanupInterval);
        }

        // Schedule quota monitoring
        if (options.enableQuotaMonitoring !== false) {
            const quotaMonitoringInterval = setInterval(async () => {
                try {
                    await this.runQuotaMonitoring();
                } catch (error) {
                    console.error('Scheduled quota monitoring failed:', error);
                }
            }, options.quotaMonitoringInterval || 4 * 60 * 60 * 1000); // 4 hours

            this.cleanupIntervals.set('quotaMonitoring', quotaMonitoringInterval);
        }

        console.log('Storage cleanup scheduler started');
    }

    /**
     * Stops all scheduled cleanup operations
     */
    stopScheduledCleanup(): void {
        this.cleanupIntervals.forEach((interval, name) => {
            clearInterval(interval);
            console.log(`Stopped ${name} cleanup interval`);
        });

        this.cleanupIntervals.clear();
        this.isRunning = false;
        console.log('Storage cleanup scheduler stopped');
    }

    /**
     * Runs immediate cleanup of all categories
     * @param options - Cleanup options
     */
    async runImmediateCleanup(options: CleanupOptions = {}): Promise<void> {
        try {
            console.log('Starting immediate storage cleanup...');
            
            const result = await storageManagementService.performStorageCleanup({
                failedGenerationAge: 24,
                tempFileAge: 6,
                cleanupOldFiles: false,
                ...options
            });

            console.log('Immediate cleanup completed:', {
                failedGenerationsDeleted: result.failedGenerationsDeleted,
                tempFilesDeleted: result.tempFilesDeleted,
                oldFilesDeleted: result.oldFilesDeleted,
                totalSpaceFreed: this.formatBytes(result.totalSpaceFreed),
                errors: result.errors
            });

            // Log any errors
            if (result.errors.length > 0) {
                console.error('Cleanup errors:', result.errors);
            }
        } catch (error) {
            console.error('Immediate cleanup failed:', error);
            throw new PodcastGenerationError(
                'Immediate storage cleanup failed',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Gets current scheduler status
     */
    getSchedulerStatus(): SchedulerStatus {
        return {
            isRunning: this.isRunning,
            activeIntervals: Array.from(this.cleanupIntervals.keys()),
            nextCleanupTimes: this.getNextCleanupTimes()
        };
    }

    /**
     * Runs failed generation cleanup
     */
    private async runFailedGenerationCleanup(): Promise<void> {
        try {
            const result = await storageManagementService.cleanupFailedGenerations(24);
            console.log('Failed generation cleanup completed:', {
                filesDeleted: result.filesDeleted,
                spaceFreed: this.formatBytes(result.spaceFreed)
            });
        } catch (error) {
            console.error('Failed generation cleanup error:', error);
        }
    }

    /**
     * Runs temporary file cleanup
     */
    private async runTempFileCleanup(): Promise<void> {
        try {
            const result = await storageManagementService.cleanupOldFiles(6);
            console.log('Temp file cleanup completed:', {
                filesDeleted: result.filesDeleted,
                spaceFreed: this.formatBytes(result.spaceFreed)
            });
        } catch (error) {
            console.error('Temp file cleanup error:', error);
        }
    }

    /**
     * Runs old file cleanup
     */
    private async runOldFileCleanup(): Promise<void> {
        try {
            const result = await storageManagementService.cleanupOldFiles(30 * 24); // 30 days
            console.log('Old file cleanup completed:', {
                filesDeleted: result.filesDeleted,
                spaceFreed: this.formatBytes(result.spaceFreed)
            });
        } catch (error) {
            console.error('Old file cleanup error:', error);
        }
    }

    /**
     * Runs quota monitoring and alerts
     */
    private async runQuotaMonitoring(): Promise<void> {
        try {
            const quotaStatus = await storageManagementService.monitorStorageQuota();
            
            // Log warnings if usage is high
            if (quotaStatus.warnings.length > 0) {
                console.warn('Storage quota warnings:', quotaStatus.warnings);
                console.log('Recommendations:', quotaStatus.recommendations);
            }

            // Trigger emergency cleanup if usage is critical
            if (quotaStatus.utilization.sizePercentage > 95) {
                console.warn('Critical storage usage detected, triggering emergency cleanup');
                await this.runImmediateCleanup({
                    failedGenerationAge: 1,
                    tempFileAge: 1,
                    cleanupOldFiles: true,
                    oldFileAge: 7 * 24
                });
            }
        } catch (error) {
            console.error('Quota monitoring error:', error);
        }
    }

    /**
     * Gets estimated next cleanup times
     */
    private getNextCleanupTimes(): Record<string, Date> {
        const now = new Date();
        const times: Record<string, Date> = {};

        if (this.cleanupIntervals.has('failedGenerations')) {
            times.failedGenerations = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }

        if (this.cleanupIntervals.has('tempFiles')) {
            times.tempFiles = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        }

        if (this.cleanupIntervals.has('oldFiles')) {
            times.oldFiles = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        if (this.cleanupIntervals.has('quotaMonitoring')) {
            times.quotaMonitoring = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        }

        return times;
    }

    /**
     * Formats bytes to human readable format
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

/**
 * Scheduled cleanup configuration options
 */
export interface ScheduledCleanupOptions {
    enableFailedGenerationCleanup?: boolean;
    enableTempFileCleanup?: boolean;
    enableOldFileCleanup?: boolean;
    enableQuotaMonitoring?: boolean;
    failedGenerationInterval?: number; // milliseconds
    tempFileInterval?: number; // milliseconds
    oldFileInterval?: number; // milliseconds
    quotaMonitoringInterval?: number; // milliseconds
}

/**
 * Scheduler status information
 */
export interface SchedulerStatus {
    isRunning: boolean;
    activeIntervals: string[];
    nextCleanupTimes: Record<string, Date>;
}

// Export singleton instance
export const storageCleanupScheduler = new StorageCleanupScheduler();