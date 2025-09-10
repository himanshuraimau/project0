/**
 * Audio Storage Service
 * Handles audio file storage operations for podcast generation
 * Uses local file system storage for development
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */

import fs from 'fs/promises';
import path from 'path';
import { PodcastGenerationError } from './types/podcast.types';

interface AudioFile {
    id: string;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
    metadata?: Record<string, any>;
}

interface UploadOptions {
    filename?: string;
    metadata?: Record<string, any>;
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
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

/**
 * Service for managing podcast audio storage using local file system
 * Handles upload, organization, metadata, and cleanup operations
 */
export class AudioStorageService {
    private readonly maxFileSize = 100 * 1024 * 1024; // 100MB limit
    private readonly allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    private readonly STORAGE_DIR = path.join(process.cwd(), 'public', 'podcasts', 'audio');

    constructor() {
        // Ensure storage directory exists
        this.ensureStorageDirectory();
    }

    /**
     * Ensure storage directory exists
     */
    private async ensureStorageDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.STORAGE_DIR, { recursive: true });
        } catch (error) {
            console.error('Failed to create storage directory:', error);
        }
    }

    /**
     * Uploads podcast audio to local storage
     * @param audioBuffer - The audio file buffer
     * @param metadata - Podcast metadata for file organization
     * @returns Promise<string> - The local URL of the uploaded file
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

            // Validate audio buffer
            const validation = await this.validateAudioBuffer(audioBuffer);
            if (!validation.isValid) {
                throw new PodcastGenerationError(
                    `Audio validation failed: ${validation.errors.join(', ')}`,
                    { code: 'STORAGE_FAILED', details: validation }
                );
            }

            // Generate organized file path
            const fileName = this.generateFileName(metadata);
            const filePath = path.join(this.STORAGE_DIR, fileName);

            // Write file to disk
            await fs.writeFile(filePath, audioBuffer);

            // Create metadata file
            const metadataPath = path.join(this.STORAGE_DIR, `${fileName}.meta.json`);
            const fileMetadata = {
                podcastId: metadata.podcastId,
                noteId: metadata.noteId,
                userId: metadata.userId,
                title: metadata.title,
                language: metadata.language,
                durationPreset: metadata.durationPreset,
                uploadedAt: new Date().toISOString(),
                originalSize: audioBuffer.length,
                mimeType: this.detectMimeType(audioBuffer),
            };
            await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));

            return `/podcasts/audio/${fileName}`;
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
     * Uploads individual audio segment to local storage
     * @param segmentBuffer - The audio segment buffer
     * @param metadata - Segment metadata
     * @returns Promise<string> - The local URL of the uploaded segment
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

            // Generate segment file name
            const fileName = `segment-${metadata.sequenceOrder}-${metadata.speaker}-${metadata.podcastId}.mp3`;
            const filePath = path.join(this.STORAGE_DIR, fileName);

            // Write segment to disk
            await fs.writeFile(filePath, segmentBuffer);

            // Create metadata file
            const metadataPath = path.join(this.STORAGE_DIR, `${fileName}.meta.json`);
            const fileMetadata = {
                podcastId: metadata.podcastId,
                segmentId: metadata.segmentId,
                speaker: metadata.speaker,
                sequenceOrder: metadata.sequenceOrder,
                uploadedAt: new Date().toISOString(),
                originalSize: segmentBuffer.length,
                mimeType: this.detectMimeType(segmentBuffer),
            };
            await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));

            return `/podcasts/audio/${fileName}`;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to upload audio segment to storage',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes podcast audio and all associated segments from local storage
     * @param podcastId - The podcast ID
     * @returns Promise<void>
     */
    async deletePodcastAudio(podcastId: string): Promise<void> {
        try {
            await this.ensureStorageDirectory();

            const files = await fs.readdir(this.STORAGE_DIR);
            const podcastFiles = files.filter(file => file.includes(podcastId));

            // Delete all files associated with this podcast
            const deletePromises = podcastFiles.map(async (file) => {
                const filePath = path.join(this.STORAGE_DIR, file);
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.warn(`Failed to delete file ${file}:`, error);
                }
            });

            await Promise.all(deletePromises);
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete podcast audio from storage',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes a specific audio segment from local storage
     * @param segmentUrl - The URL of the segment to delete (or filename)
     * @returns Promise<void>
     */
    async deleteAudioSegment(segmentUrl: string): Promise<void> {
        try {
            // Extract filename from URL
            const fileName = segmentUrl.split('/').pop() || segmentUrl;
            const filePath = path.join(this.STORAGE_DIR, fileName);
            const metadataPath = path.join(this.STORAGE_DIR, `${fileName}.meta.json`);

            // Delete both the audio file and metadata
            await Promise.all([
                fs.unlink(filePath).catch(() => { }), // Ignore if file doesn't exist
                fs.unlink(metadataPath).catch(() => { }), // Ignore if metadata doesn't exist
            ]);
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
            await this.ensureStorageDirectory();

            const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
            let cleanedCount = 0;

            const files = await fs.readdir(this.STORAGE_DIR);

            for (const file of files) {
                if (file.endsWith('.meta.json')) continue; // Skip metadata files for now

                const filePath = path.join(this.STORAGE_DIR, file);
                const stats = await fs.stat(filePath);

                if (stats.birthtime < cutoffTime) {
                    try {
                        await fs.unlink(filePath);
                        // Also delete associated metadata
                        const metadataPath = path.join(this.STORAGE_DIR, `${file}.meta.json`);
                        await fs.unlink(metadataPath).catch(() => { });
                        cleanedCount++;
                    } catch (error) {
                        console.warn(`Failed to delete old file ${file}:`, error);
                    }
                }
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
            await this.ensureStorageDirectory();

            const files = await fs.readdir(this.STORAGE_DIR);
            const audioFiles = files.filter(file =>
                !file.endsWith('.meta.json') &&
                this.allowedMimeTypes.some(type => file.endsWith(type.split('/')[1]))
            );

            let totalSizeBytes = 0;
            const fileDates: Date[] = [];
            const filesByType: Record<string, number> = {
                podcasts: 0,
                segments: 0,
                temporary: 0
            };

            for (const file of audioFiles) {
                const filePath = path.join(this.STORAGE_DIR, file);
                const stats = await fs.stat(filePath);

                totalSizeBytes += stats.size;
                fileDates.push(stats.birthtime);

                // Categorize files
                if (file.includes('segment-')) {
                    filesByType.segments++;
                } else if (file.includes('temp-')) {
                    filesByType.temporary++;
                } else {
                    filesByType.podcasts++;
                }
            }

            fileDates.sort((a, b) => a.getTime() - b.getTime());

            return {
                totalFiles: audioFiles.length,
                totalSizeBytes,
                oldestFile: fileDates.length > 0 ? fileDates[0] : null,
                newestFile: fileDates.length > 0 ? fileDates[fileDates.length - 1] : null,
                filesByType
            };
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
     * Detect MIME type from buffer
     */
    private detectMimeType(buffer: Buffer): string {
        // Check for MP3
        if (buffer.length >= 3 &&
            ((buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) || // MP3 frame header
                (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33))) { // ID3 tag
            return 'audio/mpeg';
        }

        // Check for WAV
        if (buffer.length >= 12 &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WAVE') {
            return 'audio/wav';
        }

        // Check for OGG
        if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
            return 'audio/ogg';
        }

        // Default to MP3
        return 'audio/mpeg';
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

        const timestamp = Date.now();

        return `${sanitizedTitle}-${metadata.language}-${metadata.durationPreset}-${timestamp}.mp3`;
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
}

// Export singleton instance
export const audioStorageService = new AudioStorageService();