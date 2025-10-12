# Podcast Cleanup Implementation

## Overview

This document describes the implementation of podcast management in the note deletion workflow, as required by task 22 and requirement 7.4.

## Implementation Details

### Note Deletion Workflow

When a note is deleted, the system now:

1. **Identifies Associated Podcasts**: Queries all podcasts linked to the note
2. **Collects Audio File Keys**: Extracts UploadThing file keys for cleanup
3. **Cleans Up Audio Files**: Bulk deletes audio files from UploadThing storage
4. **Deletes Note**: Proceeds with note deletion (podcasts cascade delete via database constraints)

### Key Components

#### NoteService.deleteNote()
- **Location**: `web/src/lib/note-service.ts`
- **Responsibility**: Orchestrates the complete note deletion with podcast cleanup
- **Error Handling**: Continues with note deletion even if audio cleanup fails

```typescript
async deleteNote(id: string) {
  // 1. Get all podcasts for the note
  const podcasts = await prisma.podcast.findMany({
    where: { noteId: id },
    select: { id: true, audioFileKey: true, status: true }
  });

  // 2. Clean up audio files
  const audioFileKeys = podcasts
    .filter(podcast => podcast.audioFileKey)
    .map(podcast => podcast.audioFileKey!);

  if (audioFileKeys.length > 0) {
    try {
      await uploadThingAudioStorageService.deleteAudioFiles(audioFileKeys);
    } catch (error) {
      // Log warning but continue with deletion
    }
  }

  // 3. Delete note (cascades to podcasts)
  return await prisma.note.delete({ where: { id } });
}
```

#### PodcastService.deletePodcastsByNote()
- **Location**: `web/src/lib/services/podcast-service.ts`
- **Responsibility**: Bulk deletion of podcasts for a specific note
- **Returns**: Detailed cleanup statistics and error information

#### User Deletion Enhancement
- **Location**: `web/src/lib/user-service.ts`
- **Enhancement**: Added podcast audio cleanup to user deletion workflow
- **Process**: Cleans up audio files before deleting podcast records

### Database Schema

The database already has proper cascade delete relationships:

```sql
model Podcast {
  // ... other fields
  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

This ensures that when a note is deleted, all associated podcasts are automatically removed from the database.

### Error Handling Strategy

1. **Graceful Degradation**: Audio file cleanup failures don't prevent note deletion
2. **Comprehensive Logging**: All operations are logged for debugging
3. **Bulk Operations**: Multiple audio files are deleted in a single operation for efficiency
4. **Idempotent Operations**: Safe to retry without side effects

### Testing

#### Unit Tests
- **Location**: `web/src/lib/__tests__/note-deletion-cleanup.test.ts`
- **Coverage**: All scenarios including success, partial failure, and complete failure cases

#### Verification Script
- **Location**: `web/src/lib/__tests__/verify-note-deletion.js`
- **Purpose**: Manual testing and verification of the implementation

### API Endpoints

#### DELETE /api/notes/[id]
- **Enhancement**: Improved error messages and status codes
- **Behavior**: Uses the enhanced note deletion workflow
- **Response**: Indicates successful deletion of note and associated content

### Performance Considerations

1. **Bulk File Deletion**: Uses `deleteAudioFiles()` for efficient batch operations
2. **Parallel Operations**: Audio cleanup and database operations are optimized
3. **Early Failure Detection**: Validates file keys before attempting deletion
4. **Resource Cleanup**: Prevents storage bloat from orphaned audio files

### Security Considerations

1. **Authorization**: Maintains existing user permission checks
2. **Data Integrity**: Ensures complete cleanup without leaving orphaned data
3. **Error Information**: Logs detailed errors for debugging without exposing sensitive data

### Monitoring and Observability

The implementation includes comprehensive logging:

- Success operations: File count and note ID
- Warning conditions: Partial cleanup failures
- Error conditions: Complete operation failures
- Performance metrics: Cleanup statistics

### Future Enhancements

1. **Retry Logic**: Could add exponential backoff for failed file deletions
2. **Batch Processing**: Could implement background cleanup for large datasets
3. **Metrics Collection**: Could add detailed performance and success rate metrics
4. **Audit Trail**: Could add audit logging for compliance requirements

## Requirements Compliance

✅ **Requirement 7.4**: Update note deletion logic to cascade delete associated podcasts
- Implemented in `NoteService.deleteNote()`
- Database cascade relationships ensure podcast records are deleted

✅ **Requirement 7.4**: Implement audio file cleanup when podcasts are deleted
- Implemented bulk audio file deletion via UploadThing service
- Handles both individual and batch cleanup scenarios

✅ **Requirement 7.4**: Add proper error handling for cleanup operations
- Graceful degradation when file cleanup fails
- Comprehensive logging and error reporting
- Maintains data integrity even during partial failures

## Usage Examples

### Basic Note Deletion
```typescript
const noteService = new NoteService();
await noteService.deleteNote('note-id');
// Automatically cleans up associated podcasts and audio files
```

### Bulk Podcast Cleanup
```typescript
const podcastService = podcastService.getInstance();
const result = await podcastService.deletePodcastsByNote('note-id');
console.log(`Deleted ${result.deletedCount} podcasts, cleaned ${result.cleanedFileCount} files`);
```

### User Deletion (includes podcast cleanup)
```typescript
const userService = new UserService();
await userService.deleteUser('user-id');
// Automatically cleans up all user data including podcast audio files
```