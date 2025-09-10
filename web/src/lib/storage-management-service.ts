import { audioStorageService, StorageStats } from './audio-storage-service';
import { PodcastGenerationError } from './types/podcast.types';

/**
 * Service for managing storage cleanup, monitoring, and optimization
 * Handles failed generation cleanup, quota monitoring, and error recovery
 */
export class StorageManagementService {
    private readonly quotaLimits = {
        maxTotalSizeBytes: 10 * 1024 * 1024 * 1024, // 10GB default limit
        maxFilesPerUser: 1000,
        maxFileAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    };

    private readonly cleanupSchedule = {
        failedGenerations: 24, // hours
        tempFiles: 6, // hours
        oldFiles: 7 * 24, // 7 days in hours
    };

    /**
     * Performs comprehensive storage cleanup
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

            // Clean up failed generations
            try {
                const failedCleanup = await this.cleanupFailedGenerations(
                    options.failedGenerationAge || this.cleanupSchedule.failedGenerations
                );
                result.failedGenerationsDeleted = failedCleanup.filesDeleted;
                result.totalSpaceFreed += failedCleanup.spaceFreed;
            } catch (error) {
                result.errors.push(`Failed generation cleanup error: ${error}`);
            }

            // Clean up temporary files
            try {
                const tempCleanup = await this.cleanupTemporaryFiles(
                    options.tempFileAge || this.cleanupSchedule.tempFiles
                );
                result.tempFilesDeleted = tempCleanup.filesDeleted;
                result.totalSpaceFreed += tempCleanup.spaceFreed;
            } catch (error) {
                result.errors.push(`Temporary file cleanup error: ${error}`);
            }

            // Clean up old files if enabled
            if (options.cleanupOldFiles) {
                try {
                    const oldCleanup = await this.cleanupOldFiles(
                        options.oldFileAge || this.cleanupSchedule.oldFiles
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
     * Cleans up failed podcast generation attempts
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

            // Delete associated storage files and database records
            for (const podcast of failedPodcasts) {
                try {
                    // Delete from storage
                    await audioStorageService.deletePodcastAudio(podcast.id);
                    
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
     * Cleans up temporary files and incomplete uploads
     * @param olderThanHours - Delete temp files older than this many hours
     * @returns Promise<CleanupStats> - Cleanup statistics
     */
    async cleanupTemporaryFiles(olderThanHours: number = 6): Promise<CleanupStats> {
        try {
            // Use the existing cleanup method from audio storage service
            const filesDeleted = await audioStorageService.cleanupFailedGenerations(olderThanHours);
            
            // Estimate space freed
            const spaceFreed = filesDeleted * 5 * 1024 * 1024; // Assume 5MB per temp file

            return { filesDeleted, spaceFreed };
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to cleanup temporary files',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Cleans up old podcast files based on age
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
                    await audioStorageService.deletePodcastAudio(podcast.id);
                    
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
     * Monitors storage quota and usage
     * @param userId - Optional user ID to check specific user quota
     * @returns Promise<QuotaStatus> - Current quota status
     */
    async monitorStorageQuota(userId?: string): Promise<QuotaStatus> {
        try {
            const stats = await audioStorageService.getStorageStats(userId);
            
            const quotaStatus: QuotaStatus = {
                currentUsage: {
                    totalFiles: stats.totalFiles,
                    totalSizeBytes: stats.totalSizeBytes,
                    sizeFormatted: this.formatBytes(stats.totalSizeBytes)
                },
                limits: {
                    maxTotalSizeBytes: this.quotaLimits.maxTotalSizeBytes,
                    maxFiles: this.quotaLimits.maxFilesPerUser,
                    maxFileSizeFormatted: this.formatBytes(this.quotaLimits.maxTotalSizeBytes)
                },
                utilization: {
                    sizePercentage: (stats.totalSizeBytes / this.quotaLimits.maxTotalSizeBytes) * 100,
                    filePercentage: (stats.totalFiles / this.quotaLimits.maxFilesPerUser) * 100
                },
                warnings: [],
                recommendations: []
            };

            // Add warnings for high usage
            if (quotaStatus.utilization.sizePercentage > 80) {
                quotaStatus.warnings.push('Storage usage is above 80% of quota');
                quotaStatus.recommendations.push('Consider cleaning up old or unused podcasts');
            }

            if (quotaStatus.utilization.filePercentage > 80) {
                quotaStatus.warnings.push('File count is above 80% of quota');
                quotaStatus.recommendations.push('Consider consolidating or removing old podcast files');
            }

            // Add recommendations based on usage patterns
            if (stats.oldestFile && this.isOlderThan(stats.oldestFile, 60)) { // 60 days
                quotaStatus.recommendations.push('You have files older than 60 days that could be archived');
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
    async handleStorageError(error: any, context: StorageErrorContext): Promise<StorageErrorRecovery> {
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
            
            // Clean up temp files immediately
            await this.cleanupTemporaryFiles(1); // 1 hour old
            
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
        error: any, 
        context: StorageErrorContext, 
        recovery: StorageErrorRecovery
    ): Promise<void> {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                code: error.code,
                stack: error.stack
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
    private determineErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
        if (this.isQuotaExceededError(error)) return 'high';
        if (this.isPermissionError(error)) return 'critical';
        if (this.isNetworkError(error)) return 'medium';
        return 'low';
    }

    /**
     * Checks if error is quota exceeded
     */
    private isQuotaExceededError(error: any): boolean {
        return error.message?.includes('quota') || 
               error.message?.includes('limit') ||
               error.code === 'QUOTA_EXCEEDED';
    }

    /**
     * Checks if error is network related
     */
    private isNetworkError(error: any): boolean {
        return error.message?.includes('network') ||
               error.message?.includes('timeout') ||
               error.code === 'NETWORK_ERROR';
    }

    /**
     * Checks if error is permission related
     */
    private isPermissionError(error: any): boolean {
        return error.message?.includes('permission') ||
               error.message?.includes('unauthorized') ||
               error.code === 'PERMISSION_DENIED';
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