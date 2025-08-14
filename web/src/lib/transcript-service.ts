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

      const response = await axios.get<YouTubeTranscriptResponse>(
        'https://api.scrapecreators.com/v1/youtube/video/transcript',
        {
          headers: {
            'x-api-key': apiKey,
          },
          params: {
            url: videoUrl,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          console.error('API Error:', axiosError.response.status, axiosError.response.data);
          throw new Error(`API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
        } else if (axiosError.request) {
          console.error('Network Error: No response received');
          throw new Error('Network Error: Unable to reach the API server');
        } else {
          console.error('Request Error:', axiosError.message);
          throw new Error(`Request Error: ${axiosError.message}`);
        }
      } else {
        console.error('Unexpected Error:', error);
        throw new Error(`Unexpected Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Wrap text for better readability
   */
  private wrapText(text: string, lineLength: number = 80): string {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided to wrapText:', text);
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
      console.error('Error saving transcript to database:', error);
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
      console.error('Error processing YouTube transcript:', error);
      throw new Error('Failed to process YouTube transcript');
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
      console.error('Error retrieving transcript:', error);
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
      console.error('Error retrieving user transcripts:', error);
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
      console.error('Error deleting transcript:', error);
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
      console.error('Error retrieving all transcripts:', error);
      throw new Error('Failed to retrieve transcripts');
    }
  }
}