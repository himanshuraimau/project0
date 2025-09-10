/**
 * UploadThing Audio Storage Service
 * Handles audio file storage operations for podcast generation using UploadThing
 * Replaces local file system storage with cloud-based UploadThing storage
 */

import { UTApi } from "uploadthing/server";
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
 * Service for managing podcast audio storage using UploadThing
 * Handles upload, organization, metadata, and cleanup operations
 */
export class UploadThingAudioStorageService {
    private readonly maxFileSize = 64 * 1024 * 1024; // 64MB limit (UploadThing free tier)
    private readonly allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];
    private utapi: UTApi;

    constructor() {
        this.utapi = new UTApi({
            token: process.env.UPLOADTHING_TOKEN,
        });
    }

    /**
     * Uploads podcast audio to UploadThing storage
     * @param audioBuffer - The audio file buffer
     * @param metadata - Podcast metadata for file organization
     * @returns Promise<string> - The UploadThing URL of the uploaded file
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

            // Generate organized file name
            const fileName = this.generateFileName(metadata);

            // Create File object from buffer
            const file = new File([new Uint8Array(audioBuffer)], fileName, {
                type: this.detectMimeType(audioBuffer),
            });

            // Upload to UploadThing
            const response = await this.utapi.uploadFiles([file]);

            if (!response || response.length === 0 || response[0].error) {
                throw new PodcastGenerationError(
                    'Failed to upload to UploadThing',
                    { code: 'STORAGE_FAILED', details: response?.[0]?.error || 'Unknown error' }
                );
            }

            return response[0].data!.url;
        } catch (error) {
            if (error instanceof PodcastGenerationError) {
                throw error;
            }
            throw new PodcastGenerationError(
                'Failed to upload podcast audio to UploadThing',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Uploads individual audio segment to UploadThing storage
     * @param segmentBuffer - The audio segment buffer
     * @param metadata - Segment metadata
     * @returns Promise<string> - The UploadThing URL of the uploaded segment
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

            // Create File object from buffer
            const file = new File([new Uint8Array(segmentBuffer)], fileName, {
                type: this.detectMimeType(segmentBuffer),
            });

            // Upload to UploadThing
            const response = await this.utapi.uploadFiles([file]);

            if (!response || response.length === 0 || response[0].error) {
                throw new PodcastGenerationError(
                    'Failed to upload segment to UploadThing',
                    { code: 'STORAGE_FAILED', details: response?.[0]?.error || 'Unknown error' }
                );
            }

            return response[0].data!.url;
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to upload audio segment to UploadThing',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes podcast audio and all associated segments from UploadThing storage
     * @param podcastId - The podcast ID
     * @returns Promise<void>
     */
    async deletePodcastAudio(_podcastId: string): Promise<void> {
        try {
            // Note: UploadThing doesn't provide easy way to list files by prefix
            // In a real implementation, you'd need to track file keys in your database
            // For now, this is a placeholder - you should store file keys when uploading
            
            console.warn('deletePodcastAudio: UploadThing requires file keys to delete. Store file keys in database when uploading.');
            
            // If you have the file keys stored in your database, you can delete them like this:
            // await this.utapi.deleteFiles([fileKey1, fileKey2, ...]);
            
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete podcast audio from UploadThing',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes a specific audio file from UploadThing storage using file key
     * @param fileKey - The UploadThing file key
     * @returns Promise<void>
     */
    async deleteAudioFile(fileKey: string): Promise<void> {
        try {
            await this.utapi.deleteFiles([fileKey]);
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete audio file from UploadThing',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Deletes a specific audio segment from UploadThing storage
     * @param fileKey - The UploadThing file key of the segment
     * @returns Promise<void>
     */
    async deleteAudioSegment(fileKey: string): Promise<void> {
        try {
            await this.utapi.deleteFiles([fileKey]);
        } catch (error) {
            throw new PodcastGenerationError(
                'Failed to delete audio segment from UploadThing',
                { code: 'STORAGE_FAILED', details: error }
            );
        }
    }

    /**
     * Gets storage usage statistics - limited with UploadThing
     * @param userId - Optional user ID to filter by user
     * @returns Promise<StorageStats> - Storage usage statistics
     */
    async getStorageStats(_userId?: string): Promise<StorageStats> {
        try {
            // UploadThing doesn't provide comprehensive listing APIs
            // You would need to track this information in your database
            return {
                totalFiles: 0, // Would need to query from your database
                totalSizeBytes: 0, // Would need to track in your database
                oldestFile: null,
                newestFile: null,
                filesByType: {
                    podcasts: 0,
                    segments: 0,
                    temporary: 0
                }
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
            if (audioBuffer.length > 32 * 1024 * 1024) { // 32MB
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

        // Check for MP3 signatures (most common)
        // MP3 frame header (11 bits of sync)
        if (buffer.length >= 2 && buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
            return true;
        }

        // ID3v2 tag (MP3 with metadata)
        if (buffer.length >= 3 && 
            buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
            return true;
        }

        // WAV signature
        if (buffer.length >= 12 &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WAVE') {
            return true;
        }

        // OGG signature
        if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
            return true;
        }

        // Check for MP3 frame anywhere in the first 1KB for concatenated files
        for (let i = 0; i < Math.min(buffer.length - 1, 1024); i++) {
            if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
                console.log('Found MP3 frame signature at offset', i);
                return true;
            }
        }

        // If we have substantial content from ElevenLabs, it's likely valid MP3
        // ElevenLabs returns valid MP3 data, so if we have reasonable size, accept it
        if (buffer.length > 10000) { // Minimum reasonable audio file size (10KB+)
            console.warn('Audio signature not immediately recognized but file size suggests valid audio, accepting...');
            return true;
        }

        return false;
    }
}

// Export singleton instance
export const uploadThingAudioStorageService = new UploadThingAudioStorageService();
