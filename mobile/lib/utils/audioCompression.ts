import { Audio } from 'react-native-compressor';
import * as FileSystem from 'expo-file-system';

/**
 * Audio Compression Utility
 * Compresses audio files before upload to reduce size and avoid 413 errors
 */

export interface CompressionResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress audio file for upload
 * Reduces 15MB files to ~2-3MB while maintaining speech quality
 * 
 * @param audioUri - URI of the audio file to compress
 * @returns Compressed audio URI and size information
 */
export const compressAudioForUpload = async (
  audioUri: string
): Promise<CompressionResult> => {
  try {
    // Get original file size
    const originalInfo = await FileSystem.getInfoAsync(audioUri);
    if (!originalInfo.exists) {
      throw new Error('Audio file not found');
    }
    const originalSize = originalInfo.size || 0;
    const originalSizeMB = (originalSize / 1024 / 1024).toFixed(2);

    if (__DEV__) {
      console.log(`🎵 Original audio: ${originalSizeMB}MB`);
    }

    // Compress audio with optimized settings for speech
    // These settings provide good quality for transcription while significantly reducing file size
    const compressedUri = await Audio.compress(audioUri, {
      bitrate: 64000,    // 64kbps - good quality for speech recognition
      samplerate: 16000, // 16kHz - standard for speech (Whisper works well with this)
      channels: 1,       // Mono - speech doesn't need stereo
    });

    // Get compressed file size
    const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
    const compressedSize = compressedInfo.exists ? compressedInfo.size || 0 : 0;
    const compressedSizeMB = (compressedSize / 1024 / 1024).toFixed(2);
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    if (__DEV__) {
      console.log(`📦 Compressed audio: ${compressedSizeMB}MB`);
      console.log(`✅ Compression: ${compressionRatio}% reduction`);
    }

    return {
      uri: compressedUri,
      originalSize,
      compressedSize,
      compressionRatio: parseFloat(compressionRatio),
    };
  } catch (error) {
    console.error('❌ Audio compression failed:', error);
    throw new Error('Failed to compress audio file');
  }
};

/**
 * Check if audio file needs compression
 * Files over 10MB should be compressed to avoid upload issues
 * 
 * @param audioUri - URI of the audio file
 * @returns true if file should be compressed
 */
export const shouldCompressAudio = async (audioUri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) return false;
    
    const sizeMB = (fileInfo.size || 0) / 1024 / 1024;
    return sizeMB > 10; // Compress files larger than 10MB
  } catch (error) {
    console.error('Error checking file size:', error);
    return false;
  }
};
