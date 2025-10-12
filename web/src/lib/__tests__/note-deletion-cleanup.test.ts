/**
 * Test file for note deletion with podcast cleanup
 * Requirements: 7.4 - Verify podcast management in note deletion workflow
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NoteService } from '../note-service';
import { podcastService } from '../services/podcast-service';
import { uploadThingAudioStorageService } from '../uploadthing';

// Mock the dependencies
jest.mock('../prisma', () => ({
  prisma: {
    note: {
      delete: jest.fn(),
    },
    podcast: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../uploadthing', () => ({
  uploadThingAudioStorageService: {
    deleteAudioFiles: jest.fn(),
  },
}));

jest.mock('../services/podcast-service', () => ({
  podcastService: {
    getInstance: jest.fn(() => ({
      deletePodcastsByNote: jest.fn(),
    })),
  },
}));

describe('Note Deletion with Podcast Cleanup', () => {
  let noteService: NoteService;
  let mockPrisma: any;
  let mockUploadThingService: any;
  let mockPodcastService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    noteService = new NoteService();
    
    // Get mocked instances
    mockPrisma = require('../prisma').prisma;
    mockUploadThingService = require('../uploadthing').uploadThingAudioStorageService;
    mockPodcastService = podcastService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete note and clean up associated podcast audio files', async () => {
    // Arrange
    const noteId = 'test-note-id';
    const mockPodcasts = [
      {
        id: 'podcast-1',
        audioFileKey: 'audio-file-1.mp3',
        status: 'COMPLETED',
      },
      {
        id: 'podcast-2',
        audioFileKey: 'audio-file-2.mp3',
        status: 'COMPLETED',
      },
      {
        id: 'podcast-3',
        audioFileKey: null, // No audio file
        status: 'FAILED',
      },
    ];

    const mockDeletedNote = {
      id: noteId,
      title: 'Test Note',
      content: 'Test content',
    };

    mockPrisma.podcast.findMany.mockResolvedValue(mockPodcasts);
    mockPrisma.note.delete.mockResolvedValue(mockDeletedNote);
    mockUploadThingService.deleteAudioFiles.mockResolvedValue(undefined);

    // Act
    const result = await noteService.deleteNote(noteId);

    // Assert
    expect(mockPrisma.podcast.findMany).toHaveBeenCalledWith({
      where: { noteId },
      select: {
        id: true,
        audioFileKey: true,
        status: true,
      },
    });

    expect(mockUploadThingService.deleteAudioFiles).toHaveBeenCalledWith([
      'audio-file-1.mp3',
      'audio-file-2.mp3',
    ]);

    expect(mockPrisma.note.delete).toHaveBeenCalledWith({
      where: { id: noteId },
    });

    expect(result).toEqual(mockDeletedNote);
  });

  it('should continue with note deletion even if audio file cleanup fails', async () => {
    // Arrange
    const noteId = 'test-note-id';
    const mockPodcasts = [
      {
        id: 'podcast-1',
        audioFileKey: 'audio-file-1.mp3',
        status: 'COMPLETED',
      },
    ];

    const mockDeletedNote = {
      id: noteId,
      title: 'Test Note',
      content: 'Test content',
    };

    mockPrisma.podcast.findMany.mockResolvedValue(mockPodcasts);
    mockPrisma.note.delete.mockResolvedValue(mockDeletedNote);
    mockUploadThingService.deleteAudioFiles.mockRejectedValue(new Error('Storage service unavailable'));

    // Spy on console.warn to verify warning is logged
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Act
    const result = await noteService.deleteNote(noteId);

    // Assert
    expect(mockUploadThingService.deleteAudioFiles).toHaveBeenCalledWith(['audio-file-1.mp3']);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete some audio files for note'),
      expect.any(Error)
    );
    expect(mockPrisma.note.delete).toHaveBeenCalledWith({
      where: { id: noteId },
    });
    expect(result).toEqual(mockDeletedNote);

    consoleSpy.mockRestore();
  });

  it('should handle notes with no associated podcasts', async () => {
    // Arrange
    const noteId = 'test-note-id';
    const mockDeletedNote = {
      id: noteId,
      title: 'Test Note',
      content: 'Test content',
    };

    mockPrisma.podcast.findMany.mockResolvedValue([]);
    mockPrisma.note.delete.mockResolvedValue(mockDeletedNote);

    // Act
    const result = await noteService.deleteNote(noteId);

    // Assert
    expect(mockPrisma.podcast.findMany).toHaveBeenCalledWith({
      where: { noteId },
      select: {
        id: true,
        audioFileKey: true,
        status: true,
      },
    });

    expect(mockUploadThingService.deleteAudioFiles).not.toHaveBeenCalled();
    expect(mockPrisma.note.delete).toHaveBeenCalledWith({
      where: { id: noteId },
    });
    expect(result).toEqual(mockDeletedNote);
  });

  it('should handle podcasts with no audio files', async () => {
    // Arrange
    const noteId = 'test-note-id';
    const mockPodcasts = [
      {
        id: 'podcast-1',
        audioFileKey: null,
        status: 'FAILED',
      },
      {
        id: 'podcast-2',
        audioFileKey: '',
        status: 'GENERATING',
      },
    ];

    const mockDeletedNote = {
      id: noteId,
      title: 'Test Note',
      content: 'Test content',
    };

    mockPrisma.podcast.findMany.mockResolvedValue(mockPodcasts);
    mockPrisma.note.delete.mockResolvedValue(mockDeletedNote);

    // Act
    const result = await noteService.deleteNote(noteId);

    // Assert
    expect(mockPrisma.podcast.findMany).toHaveBeenCalled();
    expect(mockUploadThingService.deleteAudioFiles).not.toHaveBeenCalled();
    expect(mockPrisma.note.delete).toHaveBeenCalledWith({
      where: { id: noteId },
    });
    expect(result).toEqual(mockDeletedNote);
  });

  it('should throw error if note deletion fails', async () => {
    // Arrange
    const noteId = 'test-note-id';
    const mockError = new Error('Database connection failed');

    mockPrisma.podcast.findMany.mockResolvedValue([]);
    mockPrisma.note.delete.mockRejectedValue(mockError);

    // Act & Assert
    await expect(noteService.deleteNote(noteId)).rejects.toThrow('Failed to delete note');
  });
});