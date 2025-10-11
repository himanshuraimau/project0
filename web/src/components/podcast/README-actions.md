# Podcast Action Components

This document describes the podcast action components that provide regenerate, download, and view transcript functionality with confirmation dialogs for destructive actions.

## Components

### PodcastActions

The main component that provides all podcast actions in a single interface.

```tsx
import { PodcastActions } from '@/components/podcast';

<PodcastActions
  podcast={podcast}
  onRegenerate={handleRegenerate}
  onDelete={handleDelete}
  disabled={loading}
  showDelete={true}
/>
```

**Props:**
- `podcast: Podcast` - The podcast object
- `onRegenerate?: (options: PodcastGenerationOptions) => Promise<void>` - Callback for regeneration
- `onDelete?: () => Promise<void>` - Callback for deletion
- `disabled?: boolean` - Disable all actions
- `showDelete?: boolean` - Show/hide delete button (default: true)

### Individual Action Components

For more granular control, you can use individual action components:

#### RegenerateButton

```tsx
import { RegenerateButton } from '@/components/podcast';

<RegenerateButton
  podcast={podcast}
  onRegenerate={handleRegenerate}
  disabled={loading}
/>
```

#### DownloadButton

```tsx
import { DownloadButton } from '@/components/podcast';

<DownloadButton
  podcast={podcast}
  disabled={loading}
/>
```

#### ViewTranscriptButton

```tsx
import { ViewTranscriptButton } from '@/components/podcast';

<ViewTranscriptButton
  podcast={podcast}
  disabled={loading}
/>
```

#### DeletePodcastButton

```tsx
import { DeletePodcastButton } from '@/components/podcast';

<DeletePodcastButton
  podcast={podcast}
  onDelete={handleDelete}
  disabled={loading}
/>
```

## Features

### Regenerate Action (Requirement 4.2)
- Uses the same options as the original podcast
- Shows loading state with spinning icon
- Displays success/error toast notifications
- Integrates with podcast service for action execution

### Download Action (Requirement 4.3)
- Downloads audio file when available
- Automatically disabled when audio is not ready
- Creates proper filename based on podcast title
- Shows appropriate error messages for unavailable files

### View Transcript Action (Requirement 4.4)
- Opens modal dialog with full transcript content
- Shows source content used to generate the podcast
- Displays podcast metadata (duration, etc.)
- Handles cases where transcript content is not available

### Delete Action
- Shows confirmation dialog before deletion
- Displays podcast title in confirmation
- Handles loading states during deletion
- Integrates with podcast service for cleanup

## Confirmation Dialogs

### Regenerate Confirmation
- No confirmation dialog (non-destructive action)
- Shows immediate feedback via toast notifications

### Delete Confirmation
- Uses AlertDialog for confirmation
- Shows podcast title and warning message
- Prevents accidental deletions
- Handles loading states during deletion process

## Error Handling

All components include comprehensive error handling:

- Network errors are caught and displayed via toast
- Loading states prevent multiple simultaneous actions
- User-friendly error messages for common scenarios
- Proper cleanup of resources on component unmount

## Integration with Podcast Service

The components are designed to work with the `usePodcast` hook:

```tsx
const { regeneratePodcast, deletePodcast, loading } = usePodcast(noteId);

const handleRegenerate = async (options: PodcastGenerationOptions) => {
  await regeneratePodcast(podcast.id, options);
};

const handleDelete = async () => {
  await deletePodcast(podcast.id);
};
```

## Styling

Components use consistent styling with the existing design system:
- shadcn/ui components for dialogs and buttons
- Tailwind CSS for styling
- Consistent with Quiz and Mindmap features
- Proper hover states and transitions
- Accessible color schemes for destructive actions

## Accessibility

- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- Focus management in dialogs
- Semantic HTML structure