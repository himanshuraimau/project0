import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storageManagementService } from '@/lib/storage-management-service';
import { storageCleanupScheduler } from '@/lib/utils/storage-cleanup-scheduler';

/**
 * POST /api/storage/cleanup
 * Triggers manual storage cleanup operations
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            type = 'all',
            failedGenerationAge = 24,
            tempFileAge = 6,
            oldFileAge = 7 * 24,
            cleanupOldFiles = false
        } = body;

        let result;

        switch (type) {
            case 'failed':
                result = await storageManagementService.cleanupFailedGenerations(failedGenerationAge);
                break;
            
            case 'temp':
                result = await storageManagementService.cleanupOldFiles(tempFileAge);
                break;
            
            case 'old':
                result = await storageManagementService.cleanupOldFiles(oldFileAge);
                break;
            
            case 'immediate':
                await storageCleanupScheduler.runImmediateCleanup({
                    failedGenerationAge,
                    tempFileAge,
                    oldFileAge,
                    cleanupOldFiles
                });
                result = { message: 'Immediate cleanup completed' };
                break;
            
            case 'all':
            default:
                result = await storageManagementService.performStorageCleanup({
                    failedGenerationAge,
                    tempFileAge,
                    oldFileAge,
                    cleanupOldFiles
                });
                break;
        }

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Storage cleanup API error:', error);
        return NextResponse.json(
            { 
                error: 'Storage cleanup failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/storage/cleanup
 * Gets storage cleanup status and statistics
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const includeQuota = searchParams.get('includeQuota') === 'true';
        const userSpecific = searchParams.get('userSpecific') === 'true';

        const response: any = {
            schedulerStatus: storageCleanupScheduler.getSchedulerStatus()
        };

        // Include quota information if requested
        if (includeQuota) {
            response.quotaStatus = await storageManagementService.monitorStorageQuota(
                userSpecific ? userId : undefined
            );
        }

        return NextResponse.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Storage status API error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to get storage status',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}