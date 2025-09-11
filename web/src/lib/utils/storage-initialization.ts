import { storageCleanupScheduler } from './storage-cleanup-scheduler';

/**
 * Initializes storage management and cleanup scheduling
 * Should be called when the application starts
 */
export async function initializeStorageManagement(): Promise<void> {
    try {
        // Only initialize in production or when explicitly enabled
        const shouldInitialize = process.env.NODE_ENV === 'production' || 
                                process.env.ENABLE_STORAGE_CLEANUP === 'true';

        if (!shouldInitialize) {
            console.log('Storage cleanup scheduler disabled in development');
            return;
        }

        // Start the cleanup scheduler with default settings
        await storageCleanupScheduler.startScheduledCleanup({
            enableFailedGenerationCleanup: true,
            enableTempFileCleanup: true,
            enableOldFileCleanup: false, // Disabled by default to preserve user data
            enableQuotaMonitoring: true,
            failedGenerationInterval: 24 * 60 * 60 * 1000, // 24 hours
            tempFileInterval: 6 * 60 * 60 * 1000, // 6 hours
            quotaMonitoringInterval: 4 * 60 * 60 * 1000, // 4 hours
        });

        console.log('Storage management initialized successfully');
    } catch (error) {
        console.error('Failed to initialize storage management:', error);
        // Don't throw error to prevent app startup failure
    }
}

/**
 * Gracefully shuts down storage management
 * Should be called when the application is shutting down
 */
export function shutdownStorageManagement(): void {
    try {
        storageCleanupScheduler.stopScheduledCleanup();
        console.log('Storage management shutdown completed');
    } catch (error) {
        console.error('Error during storage management shutdown:', error);
    }
}

/**
 * Handles process signals for graceful shutdown
 */
export function setupStorageManagementSignalHandlers(): void {
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down storage management...');
        shutdownStorageManagement();
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down storage management...');
        shutdownStorageManagement();
        process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        shutdownStorageManagement();
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled rejection at:', promise, 'reason:', reason);
        shutdownStorageManagement();
        process.exit(1);
    });
}