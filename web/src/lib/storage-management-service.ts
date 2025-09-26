import { PodcastGenerationError } from './types/podcast.types';

/**
 * Service for managing storage cleanup, monitoring, and optimization
 * Simplified for UploadThing cloud storage - mainly handles database cleanup
 */
export class StorageManagementService {
    private readonly quotaLimits = {
        maxTotalSizeBytes: 10 * 1024 * 1024 * 1024, // 10GB default limit
        maxFilesPerUser: 1000,
        maxFileAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    };

    /**
     * Performs comprehensive storage cleanup - mainly database cleanup for UploadThing
     * @param options - Cleanup configuration options
     * @returns Promise<CleanupResult> - Results of cleanup operation
     */
    async performStorageCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
        try {
            const result: CleanupResult = {
                failedGenerationsDeleted: 0,
                tempFilesDeleted: 0,
                oldFilesDeleted: 0,
                totalSpaceFreed: 0,
                errors: []
            };

            // Clean up failed generations from database (UploadThing files remain in cloud)
            try {
                const failedCleanup = await this.cleanupFailedGenerations(
                    options.failedGenerationAge || 24
                );
                result.failedGenerationsDeleted = failedCleanup.filesDeleted;
                result.totalSpaceFreed += failedCleanup.spaceFreed;
            } catch (error) {
                result.errors.push(`Failed generation cleanup error: ${error}`);
            }

            // Clean up old files if enabled
            if (options.cleanupOldFiles) {
                try {
                    const oldCleanup = await this.cleanupOldFiles(
                        options.oldFileAge || 7 * 24
                    );
                    result.oldFilesDeleted = oldCleanup.filesDeleted;
                    result.totalSpaceFreed += oldCleanup.spaceFreed;
                } catch (error) {
                    result.errors.push(`Old file cleanup error: ${error}`);
                }
            }

            return result;
        } catch (error) {
            throw new PodcastGenerationError(
                'Storage cleanup operation failed',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Cleans up failed podcast generation attempts from database
     * Note: UploadThing files are managed separately in the cloud
     * @param olderThanHours - Delete failed attempts older than this many hours
     * @returns Promise<CleanupStats> - Cleanup statistics
     */
    async cleanupFailedGenerations(olderThanHours: number = 24): Promise<CleanupStats> {
        try {
            const { prisma } = await import('./prisma');
            
            // Find failed podcast generations
            const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
            
            const failedPodcasts = await prisma.podcast.findMany({
                where: {
                    generationStatus: 'failed',
                    createdAt: {
                        lt: cutoffTime
                    }
                },
                select: {
                    id: true,
                    audioUrl: true
                }
            });

            let filesDeleted = 0;
            let spaceFreed = 0;

            // Delete database records (UploadThing files should be cleaned up separately)
            for (const podcast of failedPodcasts) {
                try {
                    // Delete from database
                    await prisma.podcastSegment.deleteMany({
                        where: { podcastId: podcast.id }
                    });
                    
                    await prisma.podcast.delete({
                        where: { id: podcast.id }
                    });

                    filesDeleted++;
                    // Estimate space freed (rough approximation)
                    spaceFreed += 10 * 1024 * 1024; // Assume 10MB per podcast
                } catch (error) {
                    console.error(`Failed to cleanup podcast ${podcast.id}:`, error);
                }
            }

            return { filesDeleted, spaceFreed };
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to cleanup failed generations',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Cleans up old podcast files based on age from database
     * Note: UploadThing files remain in cloud storage
     * @param olderThanHours - Delete files older than this many hours
     * @returns Promise<CleanupStats> - Cleanup statistics
     */
    async cleanupOldFiles(olderThanHours: number = 7 * 24): Promise<CleanupStats> {
        try {
            const { prisma } = await import('./prisma');
            
            const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
            
            const oldPodcasts = await prisma.podcast.findMany({
                where: {
                    createdAt: {
                        lt: cutoffTime
                    },
                    // Only delete completed podcasts that are very old
                    generationStatus: 'completed'
                },
                select: {
                    id: true,
                    audioUrl: true
                }
            });

            let filesDeleted = 0;
            let spaceFreed = 0;

            for (const podcast of oldPodcasts) {
                try {
                    await prisma.podcastSegment.deleteMany({
                        where: { podcastId: podcast.id }
                    });
                    
                    await prisma.podcast.delete({
                        where: { id: podcast.id }
                    });

                    filesDeleted++;
                    spaceFreed += 15 * 1024 * 1024; // Assume 15MB per old podcast
                } catch (error) {
                    console.error(`Failed to cleanup old podcast ${podcast.id}:`, error);
                }
            }

            return { filesDeleted, spaceFreed };
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to cleanup old files',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Monitors storage quota and usage - simplified for UploadThing
     * @param userId - Optional user ID to check specific user quota
     * @returns Promise<QuotaStatus> - Current quota status
     */
    async monitorStorageQuota(userId?: string): Promise<QuotaStatus> {
        try {
            // Since UploadThing manages the actual files, we can only track database records
            const { prisma } = await import('./prisma');
            
            const podcastCount = await prisma.podcast.count({
                where: userId ? { userId } : undefined
            });
            
            // Estimate total size based on podcast count (rough approximation)
            const estimatedTotalSize = podcastCount * 10 * 1024 * 1024; // 10MB per podcast
            
            const quotaStatus: QuotaStatus = {
                currentUsage: {
                    totalFiles: podcastCount,
                    totalSizeBytes: estimatedTotalSize,
                    sizeFormatted: this.formatBytes(estimatedTotalSize)
                },
                limits: {
                    maxTotalSizeBytes: this.quotaLimits.maxTotalSizeBytes,
                    maxFiles: this.quotaLimits.maxFilesPerUser,
                    maxFileSizeFormatted: this.formatBytes(this.quotaLimits.maxTotalSizeBytes)
                },
                utilization: {
                    sizePercentage: (estimatedTotalSize / this.quotaLimits.maxTotalSizeBytes) * 100,
                    filePercentage: (podcastCount / this.quotaLimits.maxFilesPerUser) * 100
                },
                warnings: [],
                recommendations: []
            };

            // Add warnings for high usage
            if (quotaStatus.utilization.sizePercentage > 80) {
                quotaStatus.warnings.push('Estimated storage usage is above 80% of quota');
                quotaStatus.recommendations.push('Consider cleaning up old or unused podcasts');
            }

            if (quotaStatus.utilization.filePercentage > 80) {
                quotaStatus.warnings.push('File count is above 80% of quota');
                quotaStatus.recommendations.push('Consider consolidating or removing old podcast files');
            }

            return quotaStatus;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to monitor storage quota',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Handles storage errors with recovery strategies
     * @param error - The storage error to handle
     * @param context - Additional context about the operation
     * @returns Promise<StorageErrorRecovery> - Recovery result
     */
    async handleStorageError(error: unknown, context: StorageErrorContext): Promise<StorageErrorRecovery> {
        try {
            const recovery: StorageErrorRecovery = {
                canRecover: false,
                recoveryAction: 'none',
                message: 'Storage error cannot be automatically recovered',
                retryAfter: null
            };

            // Analyze error type and determine recovery strategy
            if (this.isQuotaExceededError(error)) {
                recovery.canRecover = true;
                recovery.recoveryAction = 'cleanup';
                recovery.message = 'Storage quota exceeded. Performing cleanup and retry.';
                
                // Perform emergency cleanup
                await this.performEmergencyCleanup();
                recovery.retryAfter = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
            } else if (this.isNetworkError(error)) {
                recovery.canRecover = true;
                recovery.recoveryAction = 'retry';
                recovery.message = 'Network error detected. Retry recommended.';
                recovery.retryAfter = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
            } else if (this.isPermissionError(error)) {
                recovery.canRecover = false;
                recovery.recoveryAction = 'manual';
                recovery.message = 'Permission error. Manual intervention required.';
            }

            // Log error for monitoring
            await this.logStorageError(error, context, recovery);

            return recovery;
        } catch (recoveryError) {
            throw new PodcastGenerationError(
                'Storage error recovery failed',
                { code: 'STORAGE_FAILED', details: recoveryError }
            );
        }
    }

    /**
     * Performs emergency cleanup when quota is exceeded
     */
    private async performEmergencyCleanup(): Promise<void> {
        try {
            // Clean up failed generations immediately
            await this.cleanupFailedGenerations(1); // 1 hour old
            
            // If still over quota, clean up older completed files
            const quotaStatus = await this.monitorStorageQuota();
            if (quotaStatus.utilization.sizePercentage > 90) {
                await this.cleanupOldFiles(30 * 24); // 30 days
            }
        } catch (error) {
            console.error('Emergency cleanup failed:', error);
        }
    }

    /**
     * Logs storage errors for monitoring and analysis
     */
    private async logStorageError(
        error: unknown, 
        context: StorageErrorContext, 
        recovery: StorageErrorRecovery
    ): Promise<void> {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                message: error instanceof Error ? error.message : String(error),
                code: (error as any)?.code,
                stack: error instanceof Error ? error.stack : undefined
            },
            context,
            recovery,
            severity: this.determineErrorSeverity(error)
        };

        // In a production environment, this would send to a logging service
        console.error('Storage Error:', JSON.stringify(errorLog, null, 2));
    }

    /**
     * Determines error severity for monitoring
     */
    private determineErrorSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
        if (this.isQuotaExceededError(error)) return 'high';
        if (this.isPermissionError(error)) return 'critical';
        if (this.isNetworkError(error)) return 'medium';
        return 'low';
    }

    /**
     * Checks if error is quota exceeded
     */
    private isQuotaExceededError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        const code = (error as any)?.code;
        return message?.includes('quota') || 
               message?.includes('limit') ||
               code === 'QUOTA_EXCEEDED';
    }

    /**
     * Checks if error is network related
     */
    private isNetworkError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        const code = (error as any)?.code;
        return message?.includes('network') ||
               message?.includes('timeout') ||
               code === 'NETWORK_ERROR';
    }

    /**
     * Checks if error is permission related
     */
    private isPermissionError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        const code = (error as any)?.code;
        return message?.includes('permission') ||
               message?.includes('unauthorized') ||
               code === 'PERMISSION_DENIED';
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

    /**
     * Checks if date is older than specified days
     */
    private isOlderThan(date: Date, days: number): boolean {
        const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        return date < cutoff;
    }
}

/**
 * Cleanup configuration options
 */
export interface CleanupOptions {
    failedGenerationAge?: number; // hours
    tempFileAge?: number; // hours
    oldFileAge?: number; // hours
    cleanupOldFiles?: boolean;
}

/**
 * Cleanup operation result
 */
export interface CleanupResult {
    failedGenerationsDeleted: number;
    tempFilesDeleted: number;
    oldFilesDeleted: number;
    totalSpaceFreed: number;
    errors: string[];
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
    filesDeleted: number;
    spaceFreed: number;
}

/**
 * Storage quota status
 */
export interface QuotaStatus {
    currentUsage: {
        totalFiles: number;
        totalSizeBytes: number;
        sizeFormatted: string;
    };
    limits: {
        maxTotalSizeBytes: number;
        maxFiles: number;
        maxFileSizeFormatted: string;
    };
    utilization: {
        sizePercentage: number;
        filePercentage: number;
    };
    warnings: string[];
    recommendations: string[];
}

/**
 * Storage error context
 */
export interface StorageErrorContext {
    operation: string;
    podcastId?: string;
    userId?: string;
    fileSize?: number;
    timestamp: Date;
}

/**
 * Storage error recovery result
 */
export interface StorageErrorRecovery {
    canRecover: boolean;
    recoveryAction: 'none' | 'retry' | 'cleanup' | 'manual';
    message: string;
    retryAfter: Date | null;
}

// Export singleton instance
export const storageManagementService = new StorageManagementService();