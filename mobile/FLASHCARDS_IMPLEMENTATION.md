# Flashcards Feature - Implementation Guide

## Overview
A comprehensive flashcards feature with four distinct states: Card Front, Card Back with Feedback, Quiz Completion (Success), and Quiz Completion (Retry/Needs Improvement).

---

## Files Created

### 1. `/mobile/components/notes/FlashcardView.tsx`
Main flashcards component with all UI states and logic.

### 2. `/mobile/app/notes/[id]/flashcards.tsx`
Route file for displaying flashcards at `/notes/{id}/flashcards`.

---

## Features Implemented

### ✅ State Management
- **4 Main States**: loading, front, back, success, retry
- **Progress Tracking**: Current card index, cards remaining
- **Score Tracking**: Correct/wrong answers count
- **Time Tracking**: Elapsed time from start to completion

### ✅ API Integration
- **Fetch Flashcards**: `notesApi.getFlashcards(noteId)`
- **Generate Flashcards**: `notesApi.generateFlashcards({ noteId })`
- Automatic fallback to generation if flashcards don't exist
- Error handling with retry mechanism

### ✅ Navigation & Routing
- Route: `/notes/{id}/flashcards`
- Opens when user clicks "Flashcards" button in NoteView
- Back button returns to note detail

---

## UI States Breakdown

### 1. Card Front State
**Visual Elements:**
- ✅ Status bar with time (24-hour format)
- ✅ Back arrow navigation
- ✅ Pagination dots (shows up to 5 dots, active dot in blue)
- ✅ Card counter: "1/20"
- ✅ Card info: "Card 1" and "19 left"
- ✅ Large white card with question text
- ✅ Helper text: "Flip the card to see the answer"

**Interaction:**
- Tap anywhere on the card to flip and reveal answer

### 2. Card Back State
**Visual Elements:**
- ✅ Same header and pagination as front
- ✅ Large card with light green background (#D1FAE5)
- ✅ Answer text displayed
- ✅ Action buttons row:
  - Left arrow (previous card, disabled on first card)
  - "Got it wrong" (red button)
  - "Got it right" (green button)
  - Right arrow (next card)

**Interaction:**
- Click "Got it wrong" → Wrong answer count increases, move to next
- Click "Got it right" → Correct answer count increases, move to next
- Navigation arrows for manual card switching

### 3. Success State (≥70% correct)
**Visual Elements:**
- ✅ Back arrow only (no pagination)
- ✅ Large light green circle (#D1FAE5) with golden trophy icon
- ✅ Green percentage score (e.g., "100%")
- ✅ Message: "Nicely done!"
- ✅ Stats: "100% correct" and "completed in 00:50"
- ✅ Action buttons:
  - "Share" (large purple button)
  - "Create new flashcards" (light grey with plus icon)

**Interaction:**
- Share button ready for share functionality
- Create new generates fresh flashcards

### 4. Retry State (<70% correct)
**Visual Elements:**
- ✅ Back arrow only (no pagination)
- ✅ Large light orange circle (#FED7AA) with 😅 emoji
- ✅ Orange percentage score (e.g., "40%")
- ✅ Message: "Let's try that again."
- ✅ Stats: "40% correct" and "completed in 00:15"
- ✅ Action buttons:
  - "Retake" (light grey with refresh icon)
  - "Share" (black button)
  - "Create new flashcards" (light grey with plus icon)

**Interaction:**
- Retake button resets quiz to start
- Share and create new work as in success state

---

## Data Structure

### Expected API Response Format
```json
{
  "id": "flashcard-id",
  "noteId": "note-123",
  "content": {
    "flashcards": [
      {
        "id": 1,
        "front": "Which AI method includes types such as Supervised, Unsupervised, and Reinforcement Learning?",
        "back": "Machine Learning"
      },
      {
        "id": 2,
        "front": "What is the capital of France?",
        "back": "Paris"
      }
    ]
  },
  "userId": "user-123",
  "createdAt": "2025-11-16T10:00:00Z",
  "updatedAt": "2025-11-16T10:00:00Z"
}
```

### TypeScript Interfaces
```typescript
interface FlashcardItem {
  id: number
  front: string  // Question text
  back: string   // Answer text
}

interface FlashcardData {
  flashcards: FlashcardItem[]
}

type FlashcardState = 'loading' | 'front' | 'back' | 'success' | 'retry'
```

---

## Key Functions

### `fetchFlashcards()`
- Fetches existing flashcards for a note
- Fallback: Calls `generateFlashcards()` if 404 error
- Parses content JSON and extracts flashcards array
- Sets initial state to 'front'

### `generateFlashcards()`
- Generates new AI-powered flashcards
- Uses OpenAI to create question-answer pairs
- Saves to database and displays immediately

### `handleFlipCard()`
- Transitions from 'front' → 'back' state
- Shows answer with green background

### `handleGotItRight()` / `handleGotItWrong()`
- Increments correct/wrong answer counters
- Moves to next card or triggers completion

### `moveToNextCard()`
- Advances to next flashcard
- Resets to 'front' state
- Calculates final score if last card
- Shows 'success' (≥70%) or 'retry' (<70%)

### `moveToPreviousCard()`
- Goes back to previous card
- Resets to 'front' state
- Disabled on first card

### `handleRetake()`
- Resets all counters to 0
- Returns to first card
- Restarts quiz

### `getElapsedTime()`
- Calculates time since start
- Returns formatted string: "MM:SS"

### `getCompletionPercentage()`
- Calculates: (correct / total) × 100
- Used for completion screens

---

## Styling Highlights

### Color Scheme
- **Primary Purple**: `#7C3AED` (share button, active dots)
- **Success Green**: `#10B981` (correct button, success background)
- **Success Light**: `#D1FAE5` (card back, success circle)
- **Error Red**: `#EF4444` (wrong button)
- **Retry Orange**: `#F97316` (retry score)
- **Retry Light**: `#FED7AA` (retry circle)
- **Neutral Grey**: `#F3F4F6` (navigation buttons, action buttons)

### Layout
- **Card Shadow**: Subtle elevation for depth
- **Border Radius**: 20px for cards, 14px for buttons
- **Padding**: Consistent 20px horizontal, 40px in cards
- **Gap**: 12px between buttons
- **Typography**: 
  - Headers: 18px/600
  - Card text: 20px/500
  - Scores: 56px/700
  - Helper text: 14px/400

### Responsive Design
- Flexbox for consistent layouts
- ScrollView for overflow handling
- SafeAreaView for notch/status bar safety
- Home indicator at bottom

---

## Navigation Flow

```
Home Screen
    ↓
Note Detail (NoteView)
    ↓ (Click "Flashcards" button)
/notes/{id}/flashcards
    ↓
FlashcardView Component
    → Front State (initial)
    → Back State (after flip)
    → Success/Retry State (after completion)
```

### Updated NoteView Integration
```typescript
// In NoteView.tsx handleStudyToolPress()
else if (toolId === 4) { // Flashcards
  router.push(`/notes/${noteId}/flashcards`)
}
```

---

## Error Handling

### States
1. **Loading**: Shows spinner with "Loading flashcards..."
2. **Error**: Shows error icon with message and retry button
3. **404 Not Found**: Automatically attempts to generate flashcards

### User Actions on Error
- **Generate Flashcards**: Creates new flashcards using AI
- **Go Back**: Returns to note detail screen

---

## API Endpoints Used

### GET `/notes/{noteId}/flashcards`
Fetch existing flashcards for a note.

### POST `/notes/generate-flashcards`
Generate new flashcards from note content.
```json
{
  "noteId": "note-123"
}
```

---

## Testing Checklist

### Front State
- [ ] Card displays question text centered
- [ ] Helper text shows below card
- [ ] Tapping card flips to back state
- [ ] Pagination dots show correctly
- [ ] Card counter matches actual position

### Back State
- [ ] Card has green background
- [ ] Answer text displays correctly
- [ ] "Got it right" button works
- [ ] "Got it wrong" button works
- [ ] Previous arrow disabled on first card
- [ ] Next arrow moves to next card

### Success State (70%+ correct)
- [ ] Green circle with trophy displays
- [ ] Percentage shows in green
- [ ] "Nicely done!" message displays
- [ ] Completion time accurate
- [ ] Share button present
- [ ] Create new button works

### Retry State (<70% correct)
- [ ] Orange circle with emoji displays
- [ ] Percentage shows in orange
- [ ] "Let's try that again." message displays
- [ ] Retake button resets quiz
- [ ] Share button present (black)
- [ ] Create new button works

### Navigation
- [ ] Route opens from NoteView Flashcards button
- [ ] Back button returns to note detail
- [ ] All transitions smooth

### API Integration
- [ ] Fetches existing flashcards successfully
- [ ] Falls back to generation on 404
- [ ] Handles errors gracefully
- [ ] Generate flashcards works

---

## Future Enhancements

### Potential Features
1. **Spaced Repetition**: Track which cards need more review
2. **Shuffle Mode**: Randomize card order
3. **Favorites**: Mark difficult cards for later review
4. **Categories**: Group flashcards by topic
5. **Study Sessions**: Track multiple review sessions
6. **Export**: Share flashcards with others
7. **Import**: Load flashcards from external sources
8. **Audio**: Text-to-speech for answers
9. **Images**: Support for image-based flashcards
10. **Multiplayer**: Study with friends

### Performance Optimizations
- Lazy load cards for large decks
- Cache flashcard data locally
- Preload next card content
- Optimize animations

---

## Troubleshooting

### Issue: Flashcards not loading
**Solution**: Check if note exists and has content. Try generating flashcards.

### Issue: Wrong card count
**Solution**: Verify API returns `{ flashcards: [...] }` structure.

### Issue: Navigation doesn't work
**Solution**: Ensure route file exists at `/mobile/app/notes/[id]/flashcards.tsx`.

### Issue: Percentage calculation wrong
**Solution**: Check that `correctAnswers + wrongAnswers` equals total cards reviewed.

### Issue: Time tracking incorrect
**Solution**: Verify `startTime` is set on component mount, not on first card view.

---

## Summary

The Flashcards feature is now fully implemented with:
- ✅ 4 distinct UI states (front, back, success, retry)
- ✅ Complete API integration (fetch & generate)
- ✅ Progress tracking (cards, time, score)
- ✅ Smooth navigation and state transitions
- ✅ Beautiful, polished UI matching design specs
- ✅ Error handling and loading states
- ✅ Responsive layout with proper spacing

**Ready to use!** Click the Flashcards button in any note to start studying. 🎉
