import { prisma } from './prisma';
import axios, { AxiosError } from 'axios';
import { TranscriptData, YouTubeTranscriptResponse } from './types/documents.types';

export class TranscriptService {
  /**
   * Get YouTube transcript from external API
   */
  async getYoutubeTranscript(videoUrl: string): Promise<YouTubeTranscriptResponse> {
    try {
      const apiKey = process.env.SCRAPPER_API_KEY;

      if (!apiKey) {
        throw new Error('SCRAPPER_API_KEY environment variable is not configured');
      }

      console.log('Fetching YouTube transcript for:', videoUrl);

      const response = await axios.get<YouTubeTranscriptResponse>(
        'https://api.scrapecreators.com/v1/youtube/video/transcript',
        {
          headers: {
            'x-api-key': apiKey,
          },
          params: {
            url: videoUrl,
          },
          timeout: 60000, // 60 second timeout
        }
      );

      console.log('Successfully fetched YouTube transcript');
      return response.data;
    } catch (error) {
      console.error('YouTube transcript fetch error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('YouTube API request timed out. The video might be too long or the service is slow. Please try again.');
        }

        if (axiosError.response) {
          const status = axiosError.response.status;
          const data = axiosError.response.data;
          
          if (status === 404) {
            throw new Error('Video not found or does not have captions available.');
          } else if (status === 403) {
            throw new Error('Access denied. The video might be private or age-restricted.');
          } else if (status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          } else if (status >= 500) {
            throw new Error('YouTube transcript service is temporarily unavailable. Please try again in a few minutes.');
          }
          
          throw new Error(`YouTube API error (${status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
        } else if (axiosError.request) {
          throw new Error('Cannot connect to YouTube transcript service. Please check your internet connection and try again.');
        } else {
          throw new Error(`Request setup error: ${axiosError.message}`);
        }
      } else {
        throw new Error(`Unexpected error while fetching transcript: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Wrap text for better readability
   */
  private wrapText(text: string, lineLength: number = 80): string {
    // Validate input
    if (!text || typeof text !== 'string') {
      return '';
    }

    const words = text.split(' ');
    let wrappedText = '';
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 > lineLength && currentLine.length > 0) {
        wrappedText += currentLine + '\n';
        currentLine = word;
      } else {
        currentLine += (currentLine.length > 0 ? ' ' : '') + word;
      }
    }

    if (currentLine.length > 0) {
      wrappedText += currentLine;
    }

    return wrappedText;
  }

  /**
   * Save transcript to database
   */
  async saveTranscript(data: TranscriptData) {
    try {
      const transcript = await prisma.transcript.create({
        data: {
          fileName: data.fileName,
          originalName: data.originalName,
          content: data.content,
          cleanContent: data.cleanContent,
          pages: data.pages,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          type: data.type || 'youtube',
          userId: data.userId,
        },
      });

      return transcript;
    } catch (error) {
      throw new Error('Failed to save transcript to database');
    }
  }

  /**
   * Process and save YouTube transcript
   */
  async processYoutubeTranscript(
    videoUrl: string,
    userId?: string
  ) {
    try {
      // Get transcript from external API
      const transcriptData = await this.getYoutubeTranscript(videoUrl);

      // Validate transcript data
      if (!transcriptData.transcript_only_text) {
        throw new Error('No transcript text received from the API. The video might not have captions available.');
      }

      if (!transcriptData.videoId) {
        throw new Error('No video ID received from the API. Please check the YouTube URL.');
      }

      // Wrap text for better readability
      const wrappedText = this.wrapText(transcriptData.transcript_only_text);

      // Generate filename
      const fileName = `transcript_${transcriptData.videoId}.txt`;

      // Prepare data for database
      const dbData: TranscriptData = {
        fileName,
        originalName: transcriptData.title || `YouTube Video ${transcriptData.videoId}`,
        content: transcriptData.transcript_only_text,
        cleanContent: wrappedText,
        pages: 1,
        metadata: {
          videoId: transcriptData.videoId,
          videoUrl,
          duration: transcriptData.duration,
          source: 'youtube',
          processedAt: new Date().toISOString(),
        },
        type: 'youtube',
        userId,
      };

      // Save to database
      const savedTranscript = await this.saveTranscript(dbData);

      return savedTranscript;
    } catch (error) {
      console.error('Failed to process YouTube transcript:', error);
      throw error instanceof Error ? error : new Error('Failed to process YouTube transcript');
    }
  }

  /**
   * Get transcript by ID
   */
  async getTranscript(id: string) {
    try {
      return await prisma.transcript.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error('Failed to retrieve transcript');
    }
  }

  /**
   * Get transcripts by user ID
   */
  async getTranscriptsByUser(userId: string) {
    try {
      return await prisma.transcript.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          type: true,
          pages: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
        },
      });
    } catch (error) {
      throw new Error('Failed to retrieve user transcripts');
    }
  }

  /**
   * Delete transcript by ID
   */
  async deleteTranscript(id: string) {
    try {
      return await prisma.transcript.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error('Failed to delete transcript');
    }
  }

  /**
   * Get all transcripts (admin function)
   */
  async getAllTranscripts() {
    try {
      return await prisma.transcript.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          originalName: true,
          type: true,
          pages: true,
          userId: true,
          createdAt: true,
          metadata: true,
        },
      });
    } catch (error) {
      throw new Error('Failed to retrieve transcripts');
    }
  }
}