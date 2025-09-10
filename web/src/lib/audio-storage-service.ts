import { put, del, list } from '@vercel/blob';
import { PodcastGenerationError } from './types/podcast.types';

/**
 * Service for managing podcast audio storage using Vercel Blob
 * Handles upload, organization, metadata, and cleanup operations
 */
export class AudioStorageService {
    private readonly maxFileSize = 100 * 1024 * 1024; // 100MB limit
    private readonly allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    private readonly baseFolder = 'podcasts';

    /**
     * Uploads podcast audio to Vercel Blob storage
     * @param audioBuffer - The audio file buffer
     * @param metadata - Podcast metadata for file organization
     * @returns Promise<string> - The CDN URL of the uploaded file
     */
    async uploadPodcastAudio(
        audioBuffer: Buffer,
        metadata: {
            podcastId: string;
            noteId: string;
            userId?: string;
            title: string;
            language: string;
            durationPreset: string;
        }
    ): Promise<string> {
        try {
            // Validate file size
            if (audioBuffer.length > this.maxFileSize) {
                throw new PodcastGenerationError(
                    `Audio file too large: ${audioBuffer.length} bytes (max: ${this.maxFileSize})`,
                    { code: 'STORAGE_FAILED', details: 'File size exceeds limit' }
                );
            }

            // Generate organized file path
            const fileName = this.generateFileName(metadata);
            const filePath = this.generateFilePath(metadata, fileName);

            // Upload to Vercel Blob
            const blob = await put(filePath, audioBuffer, {
                access: 'public',
                contentType: 'audio/mpeg',
                addRandomSuffix: false, // We're already using unique IDs
            });

            return blob.url;
        } catch (error) {
            if (error instanceof PodcastGenerationError) {
                throw error;
            }
            throw new PodcastGenerationError(
                'Failed to upload podcast audio to storage',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Uploads individual audio segment to storage
     * @param segmentBuffer - The audio segment buffer
     * @param metadata - Segment metadata
     * @returns Promise<string> - The CDN URL of the uploaded segment
     */
    async uploadAudioSegment(
        segmentBuffer: Buffer,
        metadata: {
            podcastId: string;
            segmentId: string;
            speaker: 'host1' | 'host2';
            sequenceOrder: number;
        }
    ): Promise<string> {
        try {
            // Validate file size
            if (segmentBuffer.length > this.maxFileSize) {
                throw new PodcastGenerationError(
                    `Audio segment too large: ${segmentBuffer.length} bytes`,
                    { code: 'STORAGE_FAILED', details: 'Segment size exceeds limit' }
                );
            }

            // Generate segment file path
            const fileName = `segment-${metadata.sequenceOrder}-${metadata.speaker}.mp3`;
            const filePath = `${this.baseFolder}/${metadata.podcastId}/segments/${fileName}`;

            // Upload segment to Vercel Blob
            const blob = await put(filePath, segmentBuffer, {
                access: 'public',
                contentType: 'audio/mpeg',
                addRandomSuffix: false,
            });

            return blob.url;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to upload audio segment to storage',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes podcast audio and all associated segments from storage
     * @param podcastId - The podcast ID
     * @returns Promise<void>
     */
    async deletePodcastAudio(podcastId: string): Promise<void> {
        try {
            // List all files for this podcast
            const { blobs } = await list({
                prefix: `${this.baseFolder}/${podcastId}/`,
            });

            // Delete all files associated with this podcast
            const deletePromises = blobs.map(blob => del(blob.url));
            await Promise.all(deletePromises);

        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete podcast audio from storage',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes a specific audio segment from storage
     * @param segmentUrl - The URL of the segment to delete
     * @returns Promise<void>
     */
    async deleteAudioSegment(segmentUrl: string): Promise<void> {
        try {
            await del(segmentUrl);
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete audio segment from storage',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Cleans up failed generation attempts and temporary files
     * @param olderThanHours - Delete files older than this many hours (default: 24)
     * @returns Promise<number> - Number of files cleaned up
     */
    async cleanupFailedGenerations(olderThanHours: number = 24): Promise<number> {
        try {
            const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
            let cleanedCount = 0;

            // List all podcast files
            const { blobs } = await list({
                prefix: `${this.baseFolder}/`,
            });

            // Filter files older than cutoff time
            const filesToDelete = blobs.filter(blob => {
                const uploadTime = new Date(blob.uploadedAt);
                return uploadTime < cutoffTime;
            });

            // Delete old files in batches to avoid overwhelming the API
            const batchSize = 10;
            for (let i = 0; i < filesToDelete.length; i += batchSize) {
                const batch = filesToDelete.slice(i, i + batchSize);
                const deletePromises = batch.map(blob => del(blob.url));
                await Promise.all(deletePromises);
                cleanedCount += batch.length;
            }

            return cleanedCount;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to cleanup old podcast files',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Gets storage usage statistics for monitoring
     * @param userId - Optional user ID to filter by user
     * @returns Promise<StorageStats> - Storage usage statistics
     */
    async getStorageStats(userId?: string): Promise<StorageStats> {
        try {
            const prefix = userId 
                ? `${this.baseFolder}/user-${userId}/`
                : `${this.baseFolder}/`;

            const { blobs } = await list({ prefix });

            const stats: StorageStats = {
                totalFiles: blobs.length,
                totalSizeBytes: blobs.reduce((total, blob) => total + blob.size, 0),
                oldestFile: blobs.length > 0 ? new Date(Math.min(...blobs.map(b => new Date(b.uploadedAt).getTime()))) : null,
                newestFile: blobs.length > 0 ? new Date(Math.max(...blobs.map(b => new Date(b.uploadedAt).getTime()))) : null,
                filesByType: this.categorizeFilesByType(blobs)
            };

            return stats;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to get storage statistics',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Validates audio buffer format and quality
     * @param audioBuffer - The audio buffer to validate
     * @returns Promise<AudioValidationResult>
     */
    async validateAudioBuffer(audioBuffer: Buffer): Promise<AudioValidationResult> {
        try {
            // Basic validation checks
            const validation: AudioValidationResult = {
                isValid: true,
                errors: [],
                warnings: [],
                metadata: {
                    sizeBytes: audioBuffer.length,
                    estimatedDurationSeconds: this.estimateAudioDuration(audioBuffer)
                }
            };

            // Check file size
            if (audioBuffer.length === 0) {
                validation.isValid = false;
                validation.errors.push('Audio buffer is empty');
            }

            if (audioBuffer.length > this.maxFileSize) {
                validation.isValid = false;
                validation.errors.push(`File size ${audioBuffer.length} exceeds maximum ${this.maxFileSize}`);
            }

            // Check for basic audio file signatures
            const isValidAudio = this.hasValidAudioSignature(audioBuffer);
            if (!isValidAudio) {
                validation.isValid = false;
                validation.errors.push('Invalid audio file format');
            }

            // Add warnings for large files
            if (audioBuffer.length > 50 * 1024 * 1024) { // 50MB
                validation.warnings.push('Large file size may impact loading performance');
            }

            return validation;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to validate audio buffer',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Generates a unique filename for the podcast
     */
    private generateFileName(metadata: {
        podcastId: string;
        title: string;
        language: string;
        durationPreset: string;
    }): string {
        // Sanitize title for filename
        const sanitizedTitle = metadata.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const timestamp = new Date().toISOString().split('T')[0];
        
        return `${sanitizedTitle}-${metadata.language}-${metadata.durationPreset}-${timestamp}.mp3`;
    }

    /**
     * Generates organized file path for storage
     */
    private generateFilePath(metadata: {
        podcastId: string;
        noteId: string;
        userId?: string;
        language: string;
        durationPreset: string;
    }, fileName: string): string {
        const userFolder = metadata.userId ? `user-${metadata.userId}` : 'anonymous';
        const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        return `${this.baseFolder}/${userFolder}/${dateFolder}/${metadata.podcastId}/${fileName}`;
    }

    /**
     * Estimates audio duration from buffer size (rough approximation)
     */
    private estimateAudioDuration(audioBuffer: Buffer): number {
        // Rough estimation: MP3 at 128kbps ≈ 16KB per second
        const bytesPerSecond = 16 * 1024;
        return Math.round(audioBuffer.length / bytesPerSecond);
    }

    /**
     * Checks if buffer has valid audio file signature
     */
    private hasValidAudioSignature(buffer: Buffer): boolean {
        if (buffer.length < 4) return false;

        // Check for common audio file signatures
        const signatures = [
            [0xFF, 0xFB], // MP3
            [0xFF, 0xF3], // MP3
            [0xFF, 0xF2], // MP3
            [0x52, 0x49, 0x46, 0x46], // WAV (RIFF)
        ];

        return signatures.some(signature => {
            return signature.every((byte, index) => buffer[index] === byte);
        });
    }

    /**
     * Categorizes files by type for statistics
     */
    private categorizeFilesByType(blobs: any[]): Record<string, number> {
        const categories: Record<string, number> = {
            podcasts: 0,
            segments: 0,
            temporary: 0
        };

        blobs.forEach(blob => {
            if (blob.pathname.includes('/segments/')) {
                categories.segments++;
            } else if (blob.pathname.includes('/temp/')) {
                categories.temporary++;
            } else {
                categories.podcasts++;
            }
        });

        return categories;
    }
}

/**
 * Storage statistics interface
 */
export interface StorageStats {
    totalFiles: number;
    totalSizeBytes: number;
    oldestFile: Date | null;
    newestFile: Date | null;
    filesByType: Record<string, number>;
}

/**
 * Audio validation result interface
 */
export interface AudioValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata: {
        sizeBytes: number;
        estimatedDurationSeconds: number;
    };
}

// Export singleton instance
export const audioStorageService = new AudioStorageService();