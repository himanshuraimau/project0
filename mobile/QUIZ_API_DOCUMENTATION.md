# Quiz API Endpoints - Mobile Implementation

## Overview
The quiz API endpoints are already fully implemented in `/mobile/lib/api/notes.ts` following the same pattern as other API endpoints in the mobile app.

## Available Quiz Endpoints

### 1. Get Quiz by Note ID
**Function:** `getQuiz(noteId: string): Promise<Quiz>`

**Endpoint:** `GET /notes/{noteId}/quiz`

**Purpose:** Fetch an existing quiz for a specific note.

**Usage:**
```typescript
import { notesApi } from '@/lib/api';

const quiz = await notesApi.getQuiz(noteId);
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    noteId: string;
    content: any; // Quiz questions and answers
    userId?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Error Handling:**
- 401: Unauthorized (user not authenticated)
- 403: Forbidden (quiz doesn't belong to user)
- 404: Not Found (quiz doesn't exist)
- 500: Internal Server Error

---

### 2. Generate Quiz from Note
**Function:** `generateQuiz(data: GenerateQuizRequest): Promise<Quiz>`

**Endpoint:** `POST /notes/generate-quiz`

**Purpose:** Generate a new AI-powered quiz from a note's content using OpenAI.

**Request Body:**
```typescript
{
  noteId: string;
}
```

**Usage:**
```typescript
import { notesApi } from '@/lib/api';

const quiz = await notesApi.generateQuiz({ noteId: 'note-123' });
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    noteId: string;
    content: any; // Generated quiz with questions
    userId?: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Data Flow:**
1. Checks if quiz already exists for the note
2. If not, fetches the note content
3. Generates quiz questions using OpenAI
4. Saves quiz to database
5. Returns the generated quiz

---

### 3. Delete Quiz
**Function:** `deleteQuiz(noteId: string): Promise<{ message: string }>`

**Endpoint:** `DELETE /notes/{noteId}/quiz`

**Purpose:** Delete an existing quiz for a note.

**Usage:**
```typescript
import { notesApi } from '@/lib/api';

const result = await notesApi.deleteQuiz(noteId);
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: "Quiz deleted successfully"
  }
}
```

---

## Type Definitions

### Quiz Type
```typescript
interface Quiz {
  id: string;
  noteId: string;
  content: any; // Contains questions, answers, correct answers, etc.
  userId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### GenerateQuizRequest Type
```typescript
interface GenerateQuizRequest {
  noteId: string;
}
```

---

## Implementation Details

### Authentication
All quiz endpoints require authentication via Clerk:
- Token is automatically added to requests via `setClerkTokenGetter(getToken)`
- Must be initialized in components before making API calls

### Error Handling
All endpoints use consistent error handling:
```typescript
try {
  const quiz = await notesApi.getQuiz(noteId);
  // Handle success
} catch (error: any) {
  console.error('Failed to fetch quiz:', error);
  // error.message contains user-friendly error message
}
```

### API Client Configuration
The API client is configured in `/mobile/lib/api/client.ts`:
- Base URL: Points to your backend API
- Automatic token injection
- Response/error interceptors
- Consistent error formatting

---

## Usage Example in QuizView Component

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { notesApi } from '@/lib/api';
import { setClerkTokenGetter } from '@/lib/api/client';
import type { Quiz } from '@/lib/api/types';

export default function QuizView({ noteId }: { noteId: string }) {
  const { getToken } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth token getter
  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  // Fetch or generate quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const fetchedQuiz = await notesApi.getQuiz(noteId);
        setQuiz(fetchedQuiz);
      } catch (err: any) {
        // If quiz doesn't exist, generate it
        if (err.message?.includes('not found')) {
          const generatedQuiz = await notesApi.generateQuiz({ noteId });
          setQuiz(generatedQuiz);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [noteId]);

  // Rest of component...
}
```

---

## API Endpoint Mapping

According to `/mobile/api-endpoints-overview.txt`:

| Backend Endpoint | Mobile Function | Method | Purpose |
|-----------------|-----------------|--------|---------|
| `/api/notes/:id/quiz` | `getQuiz()` | GET | Get quiz by note ID |
| `/api/notes/generate-quiz` | `generateQuiz()` | POST | Generate new quiz |
| `/api/notes/:id/quiz` | `deleteQuiz()` | DELETE | Delete quiz |

---

## Integration Status

✅ **Complete** - All quiz endpoints are:
- Fully implemented in `/mobile/lib/api/notes.ts`
- Properly typed in `/mobile/lib/api/types.ts`
- Exported in `/mobile/lib/api/index.ts`
- Following the same patterns as other API endpoints
- Include proper error handling
- Support authentication via Clerk

---

## Related Endpoints

Similar implementations exist for:
- **Flashcards**: `getFlashcards()`, `generateFlashcards()`, `deleteFlashcards()`
- **Translations**: `getTranslation()`, `translateNote()`, `deleteTranslation()`
- **Notes**: `getNotes()`, `getNoteById()`, `createNote()`, etc.

All follow the same consistent pattern for easy maintenance and usage.

---

## Testing

To test the quiz endpoints:

1. **Get existing quiz:**
   ```typescript
   const quiz = await notesApi.getQuiz('note-id-here');
   ```

2. **Generate new quiz:**
   ```typescript
   const quiz = await notesApi.generateQuiz({ noteId: 'note-id-here' });
   ```

3. **Delete quiz:**
   ```typescript
   await notesApi.deleteQuiz('note-id-here');
   ```

---

## Notes

- Quiz content structure depends on backend OpenAI implementation
- Quiz generation may take several seconds depending on note length
- Always check if quiz exists before generating to avoid unnecessary API calls
- The `content` field in Quiz type is flexible (any) to accommodate various quiz formats
