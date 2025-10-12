import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PodcastGenerator } from '../podcast-generator';
import { usePodcast } from '@/hooks/use-podcast';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/use-podcast');
jest.mock('sonner');

const mockUsePodcast = usePodcast as jest.MockedFunction<typeof usePodcast>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('PodcastGenerator', () => {
  const defaultProps = {
    noteId: 'test-note-id',
    noteTitle: 'Test Note',
  };

  const mockPodcastHook = {
    podcasts: [],
    currentPodcast: null,
    loading: false,
    error: null,
    generating: false,
    progress: 0,
    generatePodcast: jest.fn(),
    getPodcastsByNote: jest.fn(),
    deletePodcast: jest.fn(),
    regeneratePodcast: jest.fn(),
    getLatestPodcast: jest.fn(),
    refreshPodcasts: jest.fn(),
    hasError: false,
    isEmpty: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePodcast.mockReturnValue(mockPodcastHook);
  });

  it('should render initial loading state', () => {
    mockUsePodcast.mockReturnValue({
      ...mockPodcastHook,
      loading: true,
    });

    render(<PodcastGenerator {...defaultProps} />);
    
    expect(screen.getByText('Loading Podcast')).toBeInTheDocument();
    expect(screen.getByText('Checking for existing content...')).toBeInTheDocument();
  });

  it('should render generation UI when no podcasts exist', async () => {
    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Generate Podcast')).toBeInTheDocument();
      expect(screen.getByText(/Transform your notes into an engaging AI-generated podcast/)).toBeInTheDocument();
    });
  });

  it('should show form when generate button is clicked', async () => {
    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /Generate Podcast/i });
      fireEvent.click(generateButton);
    });

    expect(screen.getByText('Generate Podcast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should render completed podcast with player interface', async () => {
    const completedPodcast = {
      id: 'podcast-1',
      noteId: 'test-note-id',
      status: 'COMPLETED' as const,
      audioUrl: 'https://example.com/audio.mp3',
      title: 'Test Podcast',
      mode: 'CONVERSATION' as const,
      duration: 300,
      hostVoiceId: 'host-voice',
      guestVoiceId: 'guest-voice',
      qualityPreset: 'HIGH' as const,
      durationScale: 'DEFAULT' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsePodcast.mockReturnValue({
      ...mockPodcastHook,
      podcasts: [completedPodcast],
      currentPodcast: completedPodcast,
      isEmpty: false,
    });

    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Podcast')).toBeInTheDocument();
      expect(screen.getByText('Conversation Mode')).toBeInTheDocument();
      expect(screen.getByText('Duration: 5:00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Transcript/i })).toBeInTheDocument();
    });
  });

  it('should render generating state with progress', async () => {
    const generatingPodcast = {
      id: 'podcast-1',
      noteId: 'test-note-id',
      status: 'GENERATING' as const,
      title: 'Test Podcast',
      mode: 'CONVERSATION' as const,
      progress: 45,
      hostVoiceId: 'host-voice',
      guestVoiceId: 'guest-voice',
      qualityPreset: 'HIGH' as const,
      durationScale: 'DEFAULT' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsePodcast.mockReturnValue({
      ...mockPodcastHook,
      podcasts: [generatingPodcast],
      currentPodcast: generatingPodcast,
      generating: true,
      progress: 45,
      isEmpty: false,
    });

    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Generating Podcast')).toBeInTheDocument();
      expect(screen.getByText('Progress: 45%')).toBeInTheDocument();
      expect(screen.getByText(/Creating conversation mode podcast with AI voices/)).toBeInTheDocument();
    });
  });

  it('should render failed state with error message', async () => {
    const failedPodcast = {
      id: 'podcast-1',
      noteId: 'test-note-id',
      status: 'FAILED' as const,
      title: 'Test Podcast',
      mode: 'CONVERSATION' as const,
      errorMessage: 'Generation failed due to API error',
      hostVoiceId: 'host-voice',
      guestVoiceId: 'guest-voice',
      qualityPreset: 'HIGH' as const,
      durationScale: 'DEFAULT' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsePodcast.mockReturnValue({
      ...mockPodcastHook,
      podcasts: [failedPodcast],
      currentPodcast: failedPodcast,
      isEmpty: false,
    });

    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Generation Failed')).toBeInTheDocument();
      expect(screen.getByText('Generation failed due to API error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /New Podcast/i })).toBeInTheDocument();
    });
  });

  it('should handle download audio action', async () => {
    const completedPodcast = {
      id: 'podcast-1',
      noteId: 'test-note-id',
      status: 'COMPLETED' as const,
      audioUrl: 'https://example.com/audio.mp3',
      title: 'Test Podcast',
      mode: 'CONVERSATION' as const,
      hostVoiceId: 'host-voice',
      guestVoiceId: 'guest-voice',
      qualityPreset: 'HIGH' as const,
      durationScale: 'DEFAULT' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsePodcast.mockReturnValue({
      ...mockPodcastHook,
      podcasts: [completedPodcast],
      currentPodcast: completedPodcast,
      isEmpty: false,
    });

    // Mock document.createElement and related DOM methods
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();

    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /Download/i });
      fireEvent.click(downloadButton);
    });

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe('https://example.com/audio.mp3');
    expect(mockLink.download).toBe('Test Note-podcast-1.mp3');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith('Download started');

    // Cleanup mocks
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it('should handle error display', async () => {
    mockUsePodcast.mockReturnValue({
      ...mockPodcastHook,
      error: 'Failed to load podcasts',
      hasError: true,
    });

    render(<PodcastGenerator {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load podcasts')).toBeInTheDocument();
    });
  });
});