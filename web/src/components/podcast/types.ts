export interface PodcastSection {
  title: string;
  timestamp: string;
  description: string;
}

export interface PodcastSpeaker {
  name: string;
  avatar?: string;
}

export interface PodcastData {
  id: string;
  noteId: string;
  title: string;
  description?: string;
  audioUrl: string;
  duration: number; // in seconds
  transcript?: Array<{
    speaker: string;
    text: string;
    startTime?: number; // In seconds
    endTime?: number; // In seconds
  }>;
  sections?: PodcastSection[];
  speakers?: PodcastSpeaker[];
  coverImage?: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  errorMessage?: string;
  createdAt: Date;
}

export interface PodcastPageProps {
  noteId: string;
  noteTitle?: string;
  noteContent?: string;
}
