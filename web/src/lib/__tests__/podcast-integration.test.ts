import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PodcastService } from '../podcast-service';
import { querySimilarChunks } from '../embedding-service';
import { querySimilarChunks } from '../embedding-service';
import { querySimilarChunks } from '../embedding-service';

// Mock the database and external services for testing
const mockPrisma = {
  podcastSegment: {
    findMany: mock(() => Promise.resolve([]))
  }
};

const mockIndexPodcastTranscript = mock(() => Promise.resolve());
const mockQuerySimilarChunks = mock(() => Promise.resolve([]));

// Mock modules
mock.module('../prisma', () => ({
  prisma: mockPrisma
}));

mock.module('../embedding-service', () => ({
  indexPodcastTranscript: mockIndexPodcastTranscript,
  querySimilarChunks: mockQuerySimilarChunks
}));

describe('Podcast Integration Tests', () => {
  let podcastService: PodcastService;

  beforeEach(() => {
    podcastService = new PodcastService();
    // Clear mock call history
    mockPrisma.podcastSegment.findMany.mockClear();
    mockIndexPodcastTranscript.mockClear();
    mockQuerySimilarChunks.mockClear();
  });

  describe('indexPodcastTranscript', () => {
    it('should successfully index podcast transcript segments', async () => {
      const mockSegments = [
        {
          id: 1,
          podcastId: 'test-podcast-1',
          speaker: 'host1',
          content: 'Welcome to our discussion about artificial intelligence.',
          startTime: 0,
          endTime: 5,
          sequenceOrder: 1,
          createdAt: new Date()
        },
        {
          id: 2,
          podcastId: 'test-podcast-1',
          speaker: 'host2',
          content: 'Thanks for having me. AI is indeed a fascinating topic.',
          startTime: 5,
          endTime: 10,
          sequenceOrder: 2,
          createdAt: new Date()
        }
      ];

      // Mock the database call
      mockPrisma.podcastSegment.findMany.mockResolvedValue(mockSegments);
      mockIndexPodcastTranscript.mockResolvedValue(undefined);

      // Call the method
      await podcastService.indexPodcastTranscript('test-podcast-1', 'test-note-1');

      // Verify database was queried correctly
      expect(mockPrisma.podcastSegment.findMany).toHaveBeenCalledWith({
        where: { podcastId: 'test-podcast-1' },
        orderBy: { sequenceOrder: 'asc' }
      });

      // Verify indexing was called with correct parameters
      expect(mockIndexPodcastTranscript).toHaveBeenCalledWith('test-note-1', 'test-podcast-1', mockSegments);
    });

    it('should handle empty segments gracefully', async () => {
      // Mock empty segments
      mockPrisma.podcastSegment.findMany.mockResolvedValue([]);
      mockIndexPodcastTranscript.mockResolvedValue(undefined);

      // Should not throw an error
      await expect(podcastService.indexPodcastTranscript('empty-podcast', 'test-note-1')).resolves.not.toThrow();

      // Should still call the database
      expect(mockPrisma.podcastSegment.findMany).toHaveBeenCalled();
      
      // Should not call indexing for empty segments
      expect(mockIndexPodcastTranscript).not.toHaveBeenCalled();
    });

    it('should handle database errors appropriately', async () => {
      // Mock database error
      const { prisma } = require('../prisma');
      const dbError = new Error('Database connection failed');
      prisma.podcastSegment.findMany.mockRejectedValue(dbError);

      // Should throw a PodcastGenerationError
      await expect(podcastService.indexPodcastTranscript('error-podcast', 'test-note-1'))
        .rejects.toThrow('Failed to index podcast transcript');
    });
  });

  describe('Chatbot Integration', () => {
    it('should be able to query podcast content through embedding service', async () => {
      const mockResults = [
        {
          id: 1,
          note_id: 'test-note-1',
          chunk_text: '[PODCAST:test-podcast-1] [SPEAKERS:host1,host2] [TIME:0-10] [SEQUENCE:1-2]\n\n[HOST1]: Welcome to our discussion about artificial intelligence.\n\n[HOST2]: Thanks for having me. AI is indeed a fascinating topic.\n\n[END_PODCAST_CHUNK]',
          distance: 0.1
        }
      ];

      const mockQuerySimilarChunks = querySimilarChunks as jest.MockedFunction<typeof querySimilarChunks>;
      mockQuerySimilarChunks.mockResolvedValue(mockResults);

      // Query for AI-related content
      const results = await querySimilarChunks('What is artificial intelligence?', 'test-note-1', 3);

      expect(results).toHaveLength(1);
      expect(results[0].chunk_text).toContain('[PODCAST:test-podcast-1]');
      expect(results[0].chunk_text).toContain('artificial intelligence');
      expect(results[0].chunk_text).toContain('[HOST1]:');
      expect(results[0].chunk_text).toContain('[HOST2]:');
    });
  });
});