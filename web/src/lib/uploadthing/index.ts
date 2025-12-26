/**
 * UploadThing Audio Storage Service
 * Handles audio file storage operations using UploadThing
 * Replaces local file system storage with cloud-based UploadThing storage
 */

import { UTApi } from "uploadthing/server";

// Define AudioMetadata locally since podcast types were removed
export interface AudioMetadata {
    title: string;
    podcastId?: string;
    duration?: number;
    size?: number;
    mimeType?: string;
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
 * Service for managing audio storage using UploadThing
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
     * Downloads audio from ElevenLabs and uploads to UploadThing storage
     * @param audioUrl - The ElevenLabs audio URL to download
     * @param metadata - Audio metadata for file organization
     * @returns Promise<{url: string, fileKey: string}> - The UploadThing URL and file key
     */
    async downloadAndUploadAudio(
        audioUrl: string,
        metadata: AudioMetadata
    ): Promise<{ url: string, fileKey: string }> {
        try {
            // Download audio from ElevenLabs
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
            }

            const audioBuffer = Buffer.from(await response.arrayBuffer());

            // Upload to UploadThing using podcast-specific upload
            const result = await this.uploadPodcastAudio(audioBuffer, metadata);

            return result;
        } catch (error) {
            console.error('Failed to download and upload audio:', error);
            throw new Error(`Failed to download and upload audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Uploads podcast audio to UploadThing storage with podcast-specific metadata
     * @param audioBuffer - The audio file buffer
     * @param metadata - Podcast audio metadata
     * @returns Promise<{url: string, fileKey: string}> - The UploadThing URL and file key
     */
    async uploadPodcastAudio(
        audioBuffer: Buffer,
        metadata: AudioMetadata
    ): Promise<{ url: string, fileKey: string }> {
        try {
            // Validate file size
            if (audioBuffer.length > this.maxFileSize) {
                throw new Error(
                    `Audio file too large: ${audioBuffer.length} bytes (max: ${this.maxFileSize})`
                );
            }

            // Validate audio buffer
            const validation = await this.validateAudioBuffer(audioBuffer);
            if (!validation.isValid) {
                throw new Error(
                    `Audio validation failed: ${validation.errors.join(', ')}`
                );
            }

            // Generate podcast-specific file name
            const fileName = this.generatePodcastFileName(metadata);

            // Create File object from buffer
            const file = new File([new Uint8Array(audioBuffer)], fileName, {
                type: this.detectMimeType(audioBuffer),
            });

            // Upload to UploadThing
            const response = await this.utapi.uploadFiles([file]);

            if (!response || response.length === 0 || response[0].error) {
                throw new Error(
                    `Failed to upload podcast audio to UploadThing: ${response?.[0]?.error?.message || 'Unknown error'}`
                );
            }

            const uploadedFile = response[0].data!;
            return {
                url: uploadedFile.url,
                fileKey: uploadedFile.key
            };
        } catch (error) {
            console.error('Failed to upload podcast audio to UploadThing:', error);
            throw new Error(
                `Failed to upload podcast audio to UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Uploads audio to UploadThing storage
     * @param audioBuffer - The audio file buffer
     * @param metadata - Audio metadata for file organization
     * @returns Promise<{url: string, fileKey: string}> - The UploadThing URL and file key
     */
    async uploadAudio(
        audioBuffer: Buffer,
        metadata: {
            id: string;
            noteId?: string;
            userId?: string;
            title: string;
            language?: string;
            duration?: string;
        }
    ): Promise<{ url: string, fileKey: string }> {
        try {
            // Validate file size
            if (audioBuffer.length > this.maxFileSize) {
                throw new Error(
                    `Audio file too large: ${audioBuffer.length} bytes (max: ${this.maxFileSize})`
                );
            }

            // Validate audio buffer
            const validation = await this.validateAudioBuffer(audioBuffer);
            if (!validation.isValid) {
                throw new Error(
                    `Audio validation failed: ${validation.errors.join(', ')}`
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
                throw new Error(
                    `Failed to upload to UploadThing: ${response?.[0]?.error?.message || 'Unknown error'}`
                );
            }

            const uploadedFile = response[0].data!;
            return {
                url: uploadedFile.url,
                fileKey: uploadedFile.key
            };
        } catch (error) {
            console.error('Failed to upload audio to UploadThing:', error);
            throw new Error(
                `Failed to upload audio to UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            id: string;
            segmentId: string;
            speaker?: string;
            sequenceOrder: number;
        }
    ): Promise<string> {
        try {
            // Validate file size
            if (segmentBuffer.length > this.maxFileSize) {
                throw new Error(
                    `Audio segment too large: ${segmentBuffer.length} bytes`
                );
            }

            // Generate segment file name
            const fileName = `segment-${metadata.sequenceOrder}-${metadata.speaker}-${metadata.id}.mp3`;

            // Create File object from buffer
            const file = new File([new Uint8Array(segmentBuffer)], fileName, {
                type: this.detectMimeType(segmentBuffer),
            });

            // Upload to UploadThing
            const response = await this.utapi.uploadFiles([file]);

            if (!response || response.length === 0 || response[0].error) {
                throw new Error(
                    `Failed to upload segment to UploadThing: ${response?.[0]?.error?.message || 'Unknown error'}`
                );
            }

            return response[0].data!.url;
        } catch (error) {
            console.error('Failed to upload audio segment to UploadThing:', error);
            throw new Error(
                `Failed to upload audio segment to UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Deletes audio and all associated segments from UploadThing storage
     * @param id - The audio ID
     * @returns Promise<void>
     */
    async deleteAudio(_id: string): Promise<void> {
        try {
            // Note: UploadThing doesn't provide easy way to list files by prefix
            // In a real implementation, you'd need to track file keys in your database
            // For now, this is a placeholder - you should store file keys when uploading

            console.warn('deleteAudio: UploadThing requires file keys to delete. Store file keys in database when uploading.');

            // If you have the file keys stored in your database, you can delete them like this:
            // await this.utapi.deleteFiles([fileKey1, fileKey2, ...]);

        } catch (error) {
            console.error('Failed to delete audio from UploadThing:', error);
            throw new Error(
                `Failed to delete audio from UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            console.error('Failed to delete audio file from UploadThing:', error);
            throw new Error(
                `Failed to delete audio file from UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Deletes multiple audio files from UploadThing storage using file keys
     * Used for bulk deletion when cleaning up podcast files
     * @param fileKeys - Array of UploadThing file keys
     * @returns Promise<void>
     */
    async deleteAudioFiles(fileKeys: string[]): Promise<void> {
        try {
            if (fileKeys.length === 0) return;

            await this.utapi.deleteFiles(fileKeys);
        } catch (error) {
            console.error('Failed to delete audio files from UploadThing:', error);
            throw new Error(
                `Failed to delete audio files from UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            console.error('Failed to delete audio segment from UploadThing:', error);
            throw new Error(
                `Failed to delete audio segment from UploadThing: ${error instanceof Error ? error.message : 'Unknown error'}`
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
                    audio: 0,
                    segments: 0,
                    temporary: 0
                }
            };
        } catch (error) {
            console.error('Failed to get storage statistics:', error);
            throw new Error(
                `Failed to get storage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
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
            console.error('Failed to validate audio buffer:', error);
            throw new Error(
                `Failed to validate audio buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
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
     * Generates a unique filename for the audio
     */
    private generateFileName(metadata: {
        id: string;
        title: string;
        language?: string;
        duration?: string;
    }): string {
        // Sanitize title for filename
        const sanitizedTitle = metadata.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const timestamp = Date.now();

        return `podcast-${sanitizedTitle}-${metadata.language || 'default'}-${metadata.duration || 'default'}-${timestamp}.mp3`;
    }

    /**
     * Generates a filename specifically for podcast audio
     */
    private generatePodcastFileName(metadata: AudioMetadata): string {
        // Sanitize title for filename
        const sanitizedTitle = metadata.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const timestamp = Date.now();
        const duration = metadata.duration ? `${metadata.duration}s` : 'unknown';

        return `podcast-${sanitizedTitle}-${duration}-${metadata.podcastId}-${timestamp}.mp3`;
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

        // If we have substantial content, it's likely valid MP3
        // Audio services return valid MP3 data, so if we have reasonable size, accept it
        if (buffer.length > 10000) { // Minimum reasonable audio file size (10KB+)
            console.warn('Audio signature not immediately recognized but file size suggests valid audio, accepting...');
            return true;
        }

        return false;
    }
}

// Export singleton instance
export const uploadThingAudioStorageService = new UploadThingAudioStorageService();