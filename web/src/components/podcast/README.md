# Podcast Page Components

This directory contains the redesigned podcast page components based on the new UI design specification.

## Structure

The podcast page follows a modern, clean design with a two-column layout:

### Components

1. **PodcastPage.tsx** - Main container component
   - Orchestrates all sub-components
   - Handles data fetching and state management
   - Manages podcast generation flow
   - Implements two-column responsive layout

2. **PodcastHeader.tsx** - Header section
   - Breadcrumb navigation (My Podcasts > [Podcast Title])
   - Podcast title display
   - Share and favorite action buttons

3. **PodcastTabs.tsx** - Tab switcher
   - Switches between "Sections" and "Full Transcript" views
   - Purple outline on active tab

4. **PodcastSectionsList.tsx** - Left column sections view
   - Displays stacked section cards
   - Enables navigation to specific timestamps

5. **PodcastSectionCard.tsx** - Individual section card
   - Section title (purple text)
   - Timestamp (right-aligned, purple)
   - Description (gray text, 2-3 lines)

6. **PodcastPlayer.tsx** - Right column player card
   - Cover image with share overlay
   - Speaker avatars (Leo & Maya)
   - Audio playback controls
   - Progress bar with time display
   - Playback speed control (1x, 1.25x, 1.5x, 1.75x, 2x)
   - Volume control
   - Download button
   - AI chat input at bottom

7. **PodcastTranscript.tsx** - Full transcript view
   - Formatted transcript with speaker labels
   - Sticky header with podcast title
   - Timestamps (optional)

8. **PodcastAskInput.tsx** - AI chat input
   - "Ask about this podcast..." placeholder
   - Sparkle icon (indicating AI)
   - Purple send button

9. **types.ts** - TypeScript interfaces
   - PodcastData
   - PodcastSection
   - PodcastSpeaker
   - PodcastPageProps

## Design Features

### Visual Style
- **Color Palette**: White base, soft gray containers, purple accent (#6366F1, #8B5CF6)
- **Typography**: Clean sans-serif, clear hierarchy
- **Layout**: Calm, academic, product-oriented
- **Spacing**: Generous vertical spacing for readability

### Responsiveness
- Two-column layout on desktop (lg: and above)
- Single-column stacked layout on mobile/tablet
- Sticky player on desktop for continuous playback

### User Experience
- Smooth animations and transitions
- Loading states for async operations
- Error handling with clear messaging
- Keyboard shortcuts support (existing in parent page)
- Accessibility attributes (ARIA labels, roles)

## Usage

### In Notes Page

```tsx
import { PodcastPage } from '@/components/podcast';

// Inside your component
<PodcastPage 
  noteId={noteId}
  noteTitle={note?.title}
  noteContent={note?.content}
/>
```

### Props

**PodcastPage**
- `noteId` (string, required): The note ID
- `noteTitle` (string, optional): The note title
- `noteContent` (string, optional): The note content for generation

## API Integration

The component integrates with these backend endpoints:
- `GET /api/podcast/note/[noteId]` - Fetch existing podcasts for a note
- Uses `usePodcastGeneration` hook for generating new podcasts

## Features

### Podcast Generation
1. Shows generation UI if no podcast exists
2. Supports short (3-5 min) and long (8-10 min) formats
3. Real-time progress updates during generation
4. Error handling with retry functionality

### Playback
- Standard audio controls (play, pause, skip forward/back)
- Adjustable playback speed
- Seek by dragging progress bar
- Click sections to jump to timestamps

### Content Organization
- Auto-generated sections from transcript
- Switchable views (sections vs full transcript)
- Formatted speaker-based transcript display

### Sharing & Download
- Share podcast link via Web Share API or clipboard
- Download MP3 file directly
- Share button overlay on cover image

### AI Integration
- "Ask about this podcast" input for AI-powered Q&A
- Sparkle icon indicating AI capability
- Ready for chatbot integration

## Styling

Components use:
- Tailwind CSS classes
- shadcn/ui components (Button, Avatar, Input, etc.)
- Dark mode support via `dark:` variants
- Consistent with existing app design system

## Future Enhancements

- [ ] Real-time timestamp syncing with sections
- [ ] Custom cover image upload
- [ ] Playlist functionality
- [ ] Sharing to social media platforms
- [ ] Transcript search
- [ ] Bookmarking sections
- [ ] Chapter markers
- [ ] Integration with AI chatbot for Q&A
