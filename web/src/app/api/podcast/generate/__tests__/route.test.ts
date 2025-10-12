/**
 * Tests for podcast generation API endpoint
 * Requirements: 1.3, 1.4, 6.1
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { auth } from '@clerk/nextjs/server';
import { podcastService } from '@/lib/services/podcast-service';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/podcast-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPodcastService = {
  getInstance: jest.fn(),
};
const mockServiceInstance = {
  generatePodcast: jest.fn(),
};

(podcastService as any) = mockPodcastService;

describe('/api/podcast/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPodcastService.getInstance.mockReturnValue(mockServiceInstance);
  });

  describe('POST', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should validate request body', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'POST',
        body: JSON.stringify({}), // Empty body
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation failed');
    });

    it('should validate conversation mode requires guest voice', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });

      const requestBody = {
        noteId: 'note123',
        mode: 'CONVERSATION',
        voiceSettings: {
          hostVoiceId: 'host123',
          // Missing guestVoiceId
        },
        qualityPreset: 'HIGH',
        durationScale: 'DEFAULT',
      };

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Guest voice ID is required for conversation mode');
    });

    it('should successfully generate podcast with valid data', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockServiceInstance.generatePodcast.mockResolvedValue({
        success: true,
        podcast: {
          id: 'podcast123',
          noteId: 'note123',
          status: 'GENERATING',
        },
      });

      const requestBody = {
        noteId: 'note123',
        mode: 'CONVERSATION',
        voiceSettings: {
          hostVoiceId: 'host123',
          guestVoiceId: 'guest123',
        },
        qualityPreset: 'HIGH',
        durationScale: 'DEFAULT',
      };

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.podcast.id).toBe('podcast123');
      expect(mockServiceInstance.generatePodcast).toHaveBeenCalledWith(
        'note123',
        expect.objectContaining({
          mode: 'CONVERSATION',
          voiceSettings: {
            hostVoiceId: 'host123',
            guestVoiceId: 'guest123',
          },
          qualityPreset: 'HIGH',
          durationScale: 'DEFAULT',
        }),
        'user123'
      );
    });

    it('should handle service errors appropriately', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });
      mockServiceInstance.generatePodcast.mockResolvedValue({
        success: false,
        error: 'Note not found',
        code: 'NOTE_NOT_FOUND',
      });

      const requestBody = {
        noteId: 'nonexistent',
        mode: 'BULLETIN',
        voiceSettings: {
          hostVoiceId: 'host123',
        },
        qualityPreset: 'STANDARD',
        durationScale: 'DEFAULT',
      };

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Note not found');
    });
  });

  describe('GET', () => {
    it('should require authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should return generation configuration', async () => {
      mockAuth.mockResolvedValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost:3000/api/podcast/generate', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('modes');
      expect(data.data).toHaveProperty('qualityPresets');
      expect(data.data).toHaveProperty('durationScales');
      expect(data.data).toHaveProperty('limits');
      expect(data.data).toHaveProperty('supportedLanguages');
    });
  });
});