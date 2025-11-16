# Flashcard Delete Feature

## Overview

This document describes the delete flashcard functionality added to the FlashcardView component. Users can now delete all flashcards for a specific note, which will reset the view to the empty state with the "Generate Flashcards" button.

## User Flow

### 1. Delete Button Location
- **Location**: Header, next to the back button
- **Icon**: Red trash icon (`trash-2` from Feather icons)
- **Visibility**: Only shown when flashcards exist (flashcards.length > 0)
- **Color**: `#EF4444` (red) to indicate destructive action

### 2. Deletion Process
1. User taps the trash icon in the header
2. Native confirmation dialog appears with:
   - **Title**: "Delete Flashcards"
   - **Message**: "Are you sure you want to delete all flashcards for this note? This action cannot be undone."
   - **Buttons**: 
     - "Cancel" (cancel style)
     - "Delete" (destructive style, red text)
3. If user taps "Cancel", dialog closes and nothing happens
4. If user taps "Delete":
   - Delete button shows loading spinner
   - API call to delete flashcards
   - On success: View resets to empty state with "Generate Flashcards" button
   - On error: Error message is displayed

### 3. Empty State After Deletion
After successful deletion, user sees:
- Purple layers icon (64px)
- Title: "No Flashcards Available"
- Subtitle: "Generate flashcards from this note to help you memorize key concepts"
- "⚡ Generate Flashcards" button
- "Go Back" button

## Implementation Details

### State Management

```typescript
const [isDeleting, setIsDeleting] = useState(false)
```

- **Purpose**: Track whether a delete operation is in progress
- **Used for**: 
  - Disabling delete button during deletion
  - Showing loading spinner in place of trash icon
  - Preventing multiple simultaneous delete requests

### Delete Function

```typescript
const handleDeleteFlashcards = async () => {
  if (isDeleting) return

  // Confirm deletion with native alert
  Alert.alert(
    'Delete Flashcards',
    'Are you sure you want to delete all flashcards for this note? This action cannot be undone.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true)
          try {
            await notesApi.deleteFlashcards(noteId)
            // Reset state to show empty state with generate button
            setFlashcards([])
            setCurrentCard(0)
            setCorrectAnswers(0)
            setWrongAnswers(0)
            setFlashcardState('front')
            setLoading(false)
            setError(null)
          } catch (err: any) {
            console.error('Failed to delete flashcards:', err)
            setError(err.message || 'Failed to delete flashcards')
          } finally {
            setIsDeleting(false)
          }
        },
      },
    ]
  )
}
```

**Key Features**:
- **Guard clause**: Prevents multiple concurrent deletions
- **Native confirmation**: Uses React Native's `Alert.alert` for better UX
- **State reset**: Clears all flashcard-related state on success
- **Error handling**: Catches and displays errors
- **Loading state**: Shows spinner during deletion

### UI Component (Header)

```tsx
{/* Header */}
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
    <Feather name="arrow-left" size={24} color="#000" />
  </TouchableOpacity>
  {flashcards.length > 0 && (
    <TouchableOpacity 
      onPress={handleDeleteFlashcards} 
      style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <ActivityIndicator size="small" color="#EF4444" />
      ) : (
        <Feather name="trash-2" size={20} color="#EF4444" />
      )}
    </TouchableOpacity>
  )}
  <Text style={styles.headerTime}>
    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
  </Text>
  <View style={styles.headerRight}>
    <Feather name="wifi" size={16} color="#000" style={styles.headerIcon} />
    <Feather name="battery" size={16} color="#000" />
  </View>
</View>
```

**Key Features**:
- **Conditional rendering**: Only shows when `flashcards.length > 0`
- **Loading state**: Shows spinner when `isDeleting` is true
- **Disabled state**: Button disabled during deletion
- **Visual feedback**: Opacity reduced when disabled

### Styles

```typescript
deleteButton: {
  padding: 8,
  marginLeft: 8,
},
deleteButtonDisabled: {
  opacity: 0.5,
},
```

**Design Choices**:
- **Padding**: 8px for comfortable tap target
- **Margin**: 8px left spacing from back button
- **Disabled opacity**: 0.5 for visual feedback during deletion

## API Integration

### API Function Used

```typescript
/**
 * Delete flashcards for a note
 * @param noteId - Note ID
 */
export const deleteFlashcards = async (noteId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/notes/${noteId}/flashcards`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};
```

**Endpoint**: `DELETE /notes/:noteId/flashcards`

**Expected Response**:
```json
{
  "message": "Flashcards deleted successfully"
}
```

## Testing Scenarios

### 1. Happy Path
1. Navigate to note with existing flashcards
2. Tap trash icon in header
3. Confirm deletion in dialog
4. Verify:
   - Loading spinner appears briefly
   - Flashcards are deleted
   - Empty state is shown
   - "Generate Flashcards" button is available

### 2. Cancel Deletion
1. Navigate to note with existing flashcards
2. Tap trash icon in header
3. Tap "Cancel" in dialog
4. Verify:
   - Dialog closes
   - Flashcards remain intact
   - No API call is made

### 3. Error Handling
1. Navigate to note with existing flashcards
2. Disconnect from network
3. Tap trash icon and confirm deletion
4. Verify:
   - Error message is displayed
   - Flashcards remain visible
   - User can retry

### 4. Button Visibility
1. Navigate to note with no flashcards (empty state)
2. Verify: Delete button is NOT visible
3. Generate flashcards
4. Verify: Delete button IS visible

### 5. Multiple Clicks Prevention
1. Navigate to note with existing flashcards
2. Tap trash icon and confirm
3. Quickly tap trash icon again during deletion
4. Verify: 
   - Only one delete operation occurs
   - Button is disabled during deletion
   - Spinner shows loading state

## User Experience Considerations

### 1. Confirmation Dialog
- **Purpose**: Prevent accidental deletions
- **Style**: Native platform dialog (iOS/Android)
- **Message**: Clear warning about irreversibility
- **Buttons**: Clearly labeled "Cancel" and "Delete"

### 2. Visual Feedback
- **Icon color**: Red (#EF4444) signals destructive action
- **Loading state**: Spinner replaces icon during deletion
- **Disabled state**: Reduced opacity when processing
- **Empty state**: Helpful message and action button

### 3. Error Recovery
- **Clear error messages**: Display specific error text
- **Retry option**: User can generate new flashcards
- **Back button**: Always available to exit view

### 4. Accessibility
- **Touch target**: 8px padding for comfortable tapping
- **Visual contrast**: Red icon stands out from other elements
- **Loading indicator**: Clear feedback during async operation
- **Native dialog**: Platform-appropriate confirmation UI

## Comparison with Quiz Delete Feature

Both Quiz and Flashcard components now have consistent delete functionality:

| Feature | Quiz | Flashcards |
|---------|------|------------|
| **Delete Button** | ✅ Header, red trash icon | ✅ Header, red trash icon |
| **Confirmation** | ✅ Native Alert dialog | ✅ Native Alert dialog |
| **Loading State** | ✅ Spinner during deletion | ✅ Spinner during deletion |
| **Empty State** | ✅ Generate Quiz button | ✅ Generate Flashcards button |
| **Error Handling** | ✅ Error messages | ✅ Error messages |
| **State Reset** | ✅ Full reset on success | ✅ Full reset on success |

## Future Enhancements

### 1. Undo Functionality
- Add toast notification after deletion
- Provide 5-second undo window
- Cache deleted data temporarily
- Restore if user taps "Undo"

### 2. Selective Deletion
- Allow deleting individual flashcards
- Add swipe-to-delete gesture
- Bulk selection mode
- Delete only specific cards

### 3. Confirmation Settings
- User preference to skip confirmation
- "Don't ask again" checkbox
- Settings page option

### 4. Deletion Analytics
- Track deletion frequency
- Identify which notes have high deletion rates
- Use for content quality insights

### 5. Cloud Sync Consideration
- Handle offline deletions
- Sync deletion across devices
- Conflict resolution if edited elsewhere

## Code Files Modified

- `/mobile/components/notes/FlashcardView.tsx`:
  - Added `isDeleting` state variable
  - Implemented `handleDeleteFlashcards` function
  - Added delete button in header
  - Added `deleteButton` and `deleteButtonDisabled` styles
  - Imported `Alert` from React Native

## Dependencies

- **React Native Alert**: Native confirmation dialogs
- **Feather Icons**: `trash-2` icon
- **API Client**: `notesApi.deleteFlashcards()` function
- **React Hooks**: `useState` for state management

## Summary

The flashcard delete feature provides users with a safe and intuitive way to remove all flashcards for a note. The implementation follows React Native best practices with:

- ✅ Native confirmation dialogs for better UX
- ✅ Loading states and visual feedback
- ✅ Proper error handling
- ✅ Consistent design with Quiz delete feature
- ✅ Empty state with clear next action
- ✅ Prevention of accidental deletions
- ✅ Clean state management

The feature is ready for production use and provides a seamless experience for users who want to regenerate flashcards or remove outdated content.
