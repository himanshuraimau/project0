import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { chunkPodcastSegments } from '../embedding-service';

describe('Podcast Transcript Indexing', () => {
  describe('chunkPodcastSegments', () => {
    it('should create chunks from podcast segments with proper metadata', () => {
      const mockSegments = [
        {
          id: 1,
          podcastId: 'test-podcast-1',
          speaker: 'host1',
          content: 'Welcome to our podcast about machine learning. Today we\'ll discuss neural networks.',
          startTime: 0,
          endTime: 5.5,
          sequenceOrder: 1
        },
        {
          id: 2,
          podcastId: 'test-podcast-1',
          speaker: 'host2',
          content: 'That\'s right! Neural networks are fascinating. They mimic how the human brain processes information.',
          startTime: 5.5,
          endTime: 12.0,
          sequenceOrder: 2
        },
        {
          id: 3,
          podcastId: 'test-podcast-1',
          speaker: 'host1',
          content: 'Exactly. Let\'s start with the basics. A neural network consists of layers of interconnected nodes.',
          startTime: 12.0,
          endTime: 18.5,
          sequenceOrder: 3
        }
      ];

      const result = chunkPodcastSegments(mockSegments, 'test-podcast-1');

      // Should create at least one chunk
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.chunkMetadata.length).toBe(result.chunks.length);

      // First chunk should contain conversation flow
      const firstChunk = result.chunks[0];
      expect(firstChunk).toContain('[HOST1]:');
      expect(firstChunk).toContain('[HOST2]:');
      expect(firstChunk).toContain('machine learning');
      expect(firstChunk).toContain('neural networks');

      // Metadata should be properly structured
      const firstMetadata = result.chunkMetadata[0];
      expect(firstMetadata.podcastId).toBe('test-podcast-1');
      expect(firstMetadata.speakers).toContain('host1');
      expect(firstMetadata.speakers).toContain('host2');
      expect(firstMetadata.startTime).toBeGreaterThanOrEqual(0);
      expect(firstMetadata.sequenceRange[0]).toBe(1);
    });

    it('should handle empty segments gracefully', () => {
      const result = chunkPodcastSegments([], 'test-podcast-empty');
      
      expect(result.chunks).toEqual([]);
      expect(result.chunkMetadata).toEqual([]);
    });

    it('should create multiple chunks for large content', () => {
      // Create segments with very long content to force chunking
      const longContent = 'This is a very long segment. '.repeat(100); // ~3000 characters
      
      const mockSegments = [
        {
          id: 1,
          podcastId: 'test-podcast-long',
          speaker: 'host1',
          content: longContent,
          startTime: 0,
          endTime: 30,
          sequenceOrder: 1
        },
        {
          id: 2,
          podcastId: 'test-podcast-long',
          speaker: 'host2',
          content: longContent,
          startTime: 30,
          endTime: 60,
          sequenceOrder: 2
        }
      ];

      const result = chunkPodcastSegments(mockSegments, 'test-podcast-long');

      // Should create multiple chunks due to size
      expect(result.chunks.length).toBeGreaterThan(1);
      
      // Each chunk should have corresponding metadata
      expect(result.chunkMetadata.length).toBe(result.chunks.length);
      
      // Chunks should maintain conversation context with overlap
      const secondChunk = result.chunks[1];
      expect(secondChunk).toContain('[HOST1]:'); // Should have overlap from previous chunk
    });

    it('should preserve speaker information in chunks', () => {
      const mockSegments = [
        {
          id: 1,
          podcastId: 'test-podcast-speakers',
          speaker: 'host1',
          content: 'First speaker content',
          startTime: 0,
          endTime: 5,
          sequenceOrder: 1
        },
        {
          id: 2,
          podcastId: 'test-podcast-speakers',
          speaker: 'host2',
          content: 'Second speaker content',
          startTime: 5,
          endTime: 10,
          sequenceOrder: 2
        }
      ];

      const result = chunkPodcastSegments(mockSegments, 'test-podcast-speakers');
      
      const chunk = result.chunks[0];
      expect(chunk).toContain('[HOST1]: First speaker content');
      expect(chunk).toContain('[HOST2]: Second speaker content');
      
      const metadata = result.chunkMetadata[0];
      expect(metadata.speakers).toEqual(['host1', 'host2']);
    });
  });
});