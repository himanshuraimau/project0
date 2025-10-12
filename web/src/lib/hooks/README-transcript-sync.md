# Transcript Synchronization System

This system provides real-time transcript synchronization with audio playback using the Vercel AI SDK for intelligent text processing.

## Overview

The transcript synchronization system consists of two main components:

1. **`use-transcript-sync.ts`** - React hook for managing transcript synchronization state
2. **`transcript-sync.ts`** - Utility functions for processing transcripts with AI

## Features

- **AI-Powered Text Chunking**: Uses OpenAI to intelligently split transcripts into natural speaking segments
- **Dual Sync Modes**: 
  - `realtime` - Uses actual timestamps from audio metadata
  - `simulated` - Estimates timing based on text length and audio duration
- **Progressive Text Reveal**: Shows text as it's being spoken
- **Topic Extraction**: Automatically identifies key topics and timestamps for navigation
- **Speaker Detection**: Identifies different speakers in conversations
- **Error Handling**: Graceful fallbacks when AI processing fails

## Usage

### Basic Usage

```typescript
import { useTranscriptSync } from '@/lib/hooks/use-transcript-sync';

function PodcastPlayer({ audioUrl, transcript }) {
  const { state: audioState, controls } = useAudioPlayer(audioUrl, {
    onTimeUpdate: (currentTime) => {
      transcriptSync.updateCurrentTime(currentTime);
    },
  });

  const transcriptSync = useTranscriptSync({
    transcript,
    audioDuration: audioState.duration,
    syncMode: 'simulated',
    autoEnhance: true,
  });

  return (
    <div>
      <div dangerouslySetInnerHTML={{ 
        __html: transcriptSync.highlightedText 
      }} />
    </div>
  );
}
```

### Advanced Usage with Topics

```typescript
const transcriptSync = useTranscriptSync({
  transcript,
  audioDuration: audioState.duration,
  syncMode: 'simulated',
  autoEnhance: true,
  enableTopicExtraction: true,
});

// Jump to a specific topic
const handleTopicClick = (topicIndex) => {
  const timestamp = transcriptSync.jumpToTopic(topicIndex);
  if (timestamp !== null) {
    audioControls.seek(timestamp);
  }
};

// Display topics
transcriptSync.topics.map((topic, index) => (
  <button key={index} onClick={() => handleTopicClick(index)}>
    {topic.topic} ({formatTime(topic.timestamp)})
  </button>
));
```

## Hook API

### `useTranscriptSync(options)`

#### Options

- `transcript: string` - The transcript text to synchronize
- `audioDuration?: number` - Duration of the audio in seconds
- `syncMode?: 'realtime' | 'simulated'` - Synchronization mode (default: 'simulated')
- `autoEnhance?: boolean` - Whether to enhance transcript formatting with AI (default: false)
- `enableTopicExtraction?: boolean` - Whether to extract topics (default: true)

#### Returns

- `syncData: TranscriptSyncData | null` - Processed transcript data with chunks
- `syncState: TranscriptSyncState` - Current synchronization state
- `isProcessing: boolean` - Whether AI processing is in progress
- `error: string | null` - Any processing errors
- `highlightedText: string` - HTML string with current chunk highlighted
- `progress: number` - Progress percentage (0-100)
- `activeChunk: TextChunk | null` - Currently active text chunk
- `topics: Array<{topic, timestamp, chunkId}>` - Extracted topics
- `updateCurrentTime: (time: number) => void` - Update current playback time
- `setSyncMode: (mode) => void` - Change synchronization mode
- `jumpToChunk: (chunkId) => number | null` - Jump to specific chunk
- `jumpToTopic: (index) => number | null` - Jump to specific topic
- `reprocessTranscript: () => Promise<void>` - Reprocess transcript
- `enhanceTranscript: () => Promise<void>` - Enhance transcript formatting

## Utility Functions

### `processTranscriptForSync(transcript, audioDuration?)`

Processes raw transcript text into synchronized chunks using AI.

### `findActiveChunk(chunks, currentTime, syncMode)`

Finds the currently active chunk based on playback time.

### `getHighlightedText(chunks, activeChunk, currentTime, syncMode)`

Generates HTML with the current chunk highlighted.

### `enhanceTranscriptFormatting(transcript)`

Uses AI to improve transcript formatting and readability.

### `extractTranscriptTopics(chunks)`

Extracts key topics and their estimated timestamps.

## Sync Modes

### Realtime Mode
- Uses actual timestamps from audio metadata
- Requires precise timing data from audio source
- Best for professionally produced content with embedded timestamps

### Simulated Mode
- Estimates timing based on text length and total audio duration
- Works with any audio content
- Good for user-generated content or when precise timestamps aren't available

## Error Handling

The system includes comprehensive error handling:

- **AI Processing Failures**: Falls back to simple sentence-based chunking
- **Invalid Data**: Validates all processed data structures
- **Network Issues**: Graceful degradation with retry mechanisms
- **Missing Dependencies**: Clear error messages for missing requirements

## Performance Considerations

- **Debounced Updates**: Text highlighting updates are debounced for smooth performance
- **Lazy Processing**: AI processing only occurs when transcript changes
- **Memory Efficient**: Minimal state storage with computed values
- **Cancellation**: Supports cleanup and cancellation of ongoing operations

## Requirements

- Vercel AI SDK (`ai` package)
- OpenAI API access (`@ai-sdk/openai`)
- React 18+ with hooks support

## Example Component

See `TranscriptSyncExample.tsx` for a complete implementation example showing:
- Audio player integration
- Topic navigation
- Sync mode switching
- Error handling
- Progress display

## Testing

Use the verification script to test the system:

```typescript
import { verifyTranscriptSync } from '@/lib/utils/verify-transcript-sync';

// Run verification
verifyTranscriptSync().then(success => {
  console.log('Verification:', success ? 'PASSED' : 'FAILED');
});
```