# Podcast Components

A comprehensive set of React components for AI-generated podcast functionality, including generation, playback, transcript synchronization, and error handling.

## Overview

This component library provides a complete solution for integrating podcast generation and playback features into your application. All components follow consistent design patterns and are built with accessibility and error handling in mind.

## Main Components

### PodcastGenerator
The primary interface for podcast generation. Handles the complete workflow from form submission to completion.

```tsx
import { PodcastGenerator } from '@/components/podcast';

<PodcastGenerator 
  noteId="note-123"
  noteTitle="My Note"
  noteContent="Content to convert to podcast"
/>
```

### PodcastPlayer
Audio player component with synchronized transcript display.

```tsx
import { PodcastPlayer } from '@/components/podcast';

<PodcastPlayer
  podcast={podcastData}
  transcript="Transcript content"
  onRegenerateClick={() => {}}
  onDownloadClick={() => {}}
  onViewTranscriptClick={() => {}}
  onDeleteClick={() => {}}
/>
```

### PodcastLayout
Two-card layout component for podcast playback and transcript viewing.

```tsx
import { PodcastLayout } from '@/components/podcast';

<PodcastLayout
  podcast={podcastData}
  noteTitle="My Podcast"
  noteContent="Source content"
  onRegenerateClick={() => {}}
  onDownloadClick={() => {}}
  onDeleteClick={() => {}}
/>
```

### PodcastForm
Generation form with voice selection and quality settings.

```tsx
import { PodcastForm } from '@/components/podcast';

<PodcastForm
  onSubmit={(data) => console.log(data)}
  isLoading={false}
/>
```

## UI Components

### PodcastControls
Reusable audio player controls.

```tsx
import { PodcastControls } from '@/components/podcast';

<PodcastControls
  state={audioPlayerState}
  controls={audioPlayerControls}
  compact={false}
/>
```

### TranscriptViewer
Synchronized transcript viewer with text highlighting.

```tsx
import { TranscriptViewer } from '@/components/podcast';

<TranscriptViewer
  transcript="Transcript content"
  currentTime={currentTime}
  audioDuration={duration}
  onTimeSeek={(time) => {}}
/>
```

## Action Components

### PodcastActions
Complete set of podcast management actions.

```tsx
import { PodcastActions } from '@/components/podcast';

<PodcastActions
  podcast={podcastData}
  onRegenerate={async (options) => {}}
  onDelete={async () => {}}
/>
```

Individual action buttons are also available:
- `RegenerateButton`
- `DownloadButton`
- `ViewTranscriptButton`
- `DeletePodcastButton`

## Loading States

All components have corresponding skeleton loading states:

```tsx
import { PodcastSkeleton } from '@/components/podcast';

<PodcastSkeleton variant="generator" />
<PodcastSkeleton variant="player" />
<PodcastSkeleton variant="layout" />
<PodcastSkeleton variant="form" />
<PodcastSkeleton variant="compact" />
```

## Error Handling

### Error Boundary
Wrap components with error boundaries for graceful error handling:

```tsx
import { PodcastErrorBoundary } from '@/components/podcast';

<PodcastErrorBoundary
  context={{ operation: 'generate', noteId: 'note-123' }}
  onRetry={() => {}}
  onRegenerate={() => {}}
>
  <PodcastGenerator noteId="note-123" />
</PodcastErrorBoundary>
```

### Error Display Components
Specialized error displays for different scenarios:

```tsx
import { 
  PodcastErrorDisplay,
  PodcastGenerationError,
  PodcastPlaybackError,
  PodcastNetworkError 
} from '@/components/podcast';

<PodcastErrorDisplay
  error={errorInfo}
  onRetry={() => {}}
  variant="default"
/>
```

## Design Patterns

### Consistent Props
All components follow consistent prop patterns:

- `className?: string` - Optional CSS class name
- `loading?: boolean` - Loading state
- `disabled?: boolean` - Disabled state
- `compact?: boolean` - Compact mode (where applicable)

### Error Handling
All components include comprehensive error handling with:

- User-friendly error messages
- Recovery options (retry, regenerate, etc.)
- Proper error boundaries
- Accessibility support

### Accessibility
Components include proper ARIA labels and keyboard navigation:

```tsx
// Use provided accessibility constants
import { PODCAST_ACCESSIBILITY } from '@/components/podcast';

<button aria-label={PODCAST_ACCESSIBILITY.labels.playButton}>
  Play
</button>
```

## Testing

Use the provided test utilities for consistent testing:

```tsx
import { createMockPodcast, PODCAST_TEST_IDS } from '@/components/podcast';

const mockPodcast = createMockPodcast({
  status: 'COMPLETED',
  audioUrl: 'https://example.com/audio.mp3'
});

// Use test IDs for reliable testing
const generator = screen.getByTestId(PODCAST_TEST_IDS.generator);
```

## TypeScript Support

All components are fully typed with comprehensive interfaces:

```tsx
import type { 
  PodcastGeneratorProps,
  PodcastPlayerProps,
  Podcast,
  PodcastGenerationForm 
} from '@/components/podcast';
```

## Requirements Compliance

This component library fulfills the following requirements:

- **5.5**: Visual consistency with Quiz and Mindmap features using shadcn components
- **1.1-1.5**: Complete podcast generation workflow
- **2.1-2.5**: Webhook-based status updates
- **3.1-3.5**: Audio playback with transcript synchronization
- **4.1-4.5**: Podcast management and actions
- **6.1-6.5**: Comprehensive error handling

## Version

Current version: 1.0.0
Last updated: 2024-10-11