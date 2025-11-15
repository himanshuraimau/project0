# Mobile App API Layer

This folder contains the complete API layer for the React Native mobile app, providing typed interfaces to communicate with the backend API.

## 📁 Structure

```
lib/api/
├── client.ts          # Axios client with auth & error handling
├── types.ts           # TypeScript interfaces for all API models
├── index.ts           # Centralized exports
├── audio.ts           # Audio transcription endpoints
├── chapter.ts         # Chapter operations, quizzes, progress
├── course.ts          # Course management
├── documents.ts       # Document CRUD operations
├── mindmap.ts         # Mind map generation
├── notes.ts           # Notes CRUD, AI generation, flashcards, quizzes
├── pdf.ts             # PDF parsing and processing
├── podcast.ts         # Podcast generation
├── search.ts          # Semantic search
├── subscription.ts    # Subscription management (Dodo Payments)
├── transcripts.ts     # Transcript management
├── user.ts            # User profile and credits
└── webpage.ts         # Webpage content extraction
```

## 🚀 Usage

### Basic Import

```typescript
import { notesApi, userApi, subscriptionApi } from '@/lib/api';

// Use the API
const notes = await notesApi.getNotes();
const profile = await userApi.getUserProfile();
```

### Named Imports

```typescript
import { getNotes, createNote, generateAINote } from '@/lib/api/notes';
import { getUserProfile, updateUserProfile } from '@/lib/api/user';

// Use directly
const notes = await getNotes();
const note = await createNote({ title: 'My Note', content: '...', transcriptId: '...' });
```

## 🔐 Authentication

The API client automatically handles authentication using tokens stored in `expo-secure-store`:

```typescript
// The client intercepts all requests and adds the Authorization header
// No manual token management needed in your components
```

## 📝 API Modules

### Notes API (`notes.ts`)

Full CRUD operations plus AI features:

```typescript
// Basic operations
const notes = await getNotes(transcriptId?);
const note = await getNoteById(id);
const newNote = await createNote(data);
const updated = await updateNote(id, data);
await deleteNote(id);

// AI Generation
const aiNote = await generateAINote({ transcriptId });
const textNote = await generateNoteFromText({ text, title });
const focusedNote = await generateFocusedNote({ transcriptId, noteType: 'summary' });

// Flashcards & Quizzes
const flashcards = await generateFlashcards({ noteId });
const quiz = await generateQuiz({ noteId });

// Translations
const translation = await translateNote(noteId, { language: 'es' });
const translationData = await getTranslation(noteId, 'es');
```

### Transcripts API (`transcripts.ts`)

```typescript
const transcripts = await getTranscripts();
const transcript = await getTranscriptById(id);
const newTranscript = await createTranscript(data);
await deleteTranscript(id);
```

### Audio API (`audio.ts`)

```typescript
const formData = new FormData();
formData.append('audio', audioFile);
const result = await transcribeAudio(formData);
```

### PDF API (`pdf.ts`)

```typescript
const formData = new FormData();
formData.append('file', pdfFile);

const parsed = await parsePDF(formData);
const processed = await processPDF(formData);
const aiResponse = await askPDFAI(pdfId, 'What is this about?');
const files = await getPDFFiles();
```

### Podcast API (`podcast.ts`)

```typescript
const podcast = await generatePodcast({
  noteId,
  mode: PodcastMode.CONVERSATION,
  hostVoiceId: 'voice-id',
  qualityPreset: QualityPreset.HIGH,
});

const podcasts = await getPodcasts();
const podcast = await getPodcastById(id);
```

### Course & Chapter API

```typescript
// Courses
const courses = await getCourses();
const course = await createCourse(courseId, { name, units });
const units = await generateUnits(courseId, { topic, numberOfUnits });

// Chapters
const chapter = await getChapterById(chapterId);
const quiz = await getChapterQuiz(chapterId);
const flashcards = await getChapterFlashcards(chapterId);
const progress = await updateChapterProgress(chapterId, { isCompleted: true });

// Chapter Chat
const messages = await getChapterChat(chapterId);
const response = await sendChapterChat(chapterId, { message: 'Explain this' });
```

### Mind Map API (`mindmap.ts`)

```typescript
const mindmap = await generateMindMap({ noteId });
const mindmap = await getMindMapByNoteId(noteId);
const updated = await updateMindMap(noteId, { title, mermaidCode });
```

### User API (`user.ts`)

```typescript
const profile = await getUserProfile();
const updated = await updateUserProfile({ name, email });
const credits = await getUserCredits();
const purchases = await getUserPurchases();
await deleteUserAccount();
```

### Subscription API (`subscription.ts`)

```typescript
const status = await getSubscriptionStatus();
const subscription = await createSubscription({
  productId,
  successUrl,
  cancelUrl,
});
await cancelSubscription();
const portal = await getSubscriptionPortal();
```

### Documents API (`documents.ts`)

```typescript
const documents = await getDocuments();
const document = await getDocumentById(id);
const newDoc = await createDocument({ name, url, type, size });
const updated = await updateDocument(id, { name });
await deleteDocument(id);
```

### Webpage API (`webpage.ts`)

```typescript
const result = await processWebpage({ url: 'https://example.com' });
// Returns: { transcript, content }
```

### Search API (`search.ts`)

```typescript
const results = await semanticSearch({
  query: 'machine learning',
  noteId?: 'optional-note-id',
  limit: 10,
});
```

## 🛠️ Configuration

Set your API base URL in your environment:

```bash
# .env or .env.local
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

For local development:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 🔄 Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

Success responses are automatically unwrapped to return just the data.

## ⚠️ Error Handling

Errors are automatically handled and thrown with meaningful messages:

```typescript
try {
  const note = await getNoteById('invalid-id');
} catch (error) {
  console.error(error.message); // User-friendly error message
}
```

Common error status codes:
- `401` - Unauthorized (token expired/invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error
- `503` - Service unavailable

## 📦 TypeScript Support

All APIs are fully typed with TypeScript interfaces defined in `types.ts`:

```typescript
import type { Note, Flashcard, Quiz, Podcast, Course } from '@/lib/api/types';
```

## 🔗 Integration with Backend

This API layer mirrors the backend API structure in `/website/app/api`:

- ✅ All endpoints from the backend are implemented
- ✅ Request/response types match Prisma schema
- ✅ Authentication flow integrated
- ✅ Error handling standardized

## 📚 Examples

### Complete Note Workflow

```typescript
import { transcribeAudio, createNote, generateFlashcards, generateQuiz } from '@/lib/api';

// 1. Transcribe audio
const formData = new FormData();
formData.append('audio', audioFile);
const { transcript } = await transcribeAudio(formData);

// 2. Create note from transcript
const note = await createNote({
  title: 'Lecture Notes',
  content: transcript.content,
  transcriptId: transcript.id,
});

// 3. Generate study materials
const flashcards = await generateFlashcards({ noteId: note.id });
const quiz = await generateQuiz({ noteId: note.id });

console.log('Study materials ready!', { note, flashcards, quiz });
```

### Subscription Check

```typescript
import { getSubscriptionStatus } from '@/lib/api/subscription';

const checkAccess = async () => {
  try {
    const subscription = await getSubscriptionStatus();
    return subscription.status === 'ACTIVE';
  } catch (error) {
    return false;
  }
};
```

## 🚧 Development

When adding new endpoints:

1. Add types to `types.ts`
2. Create/update the module file
3. Export from `index.ts`
4. Document usage in this README

## 📱 React Native Considerations

- Uses `expo-secure-store` for token storage
- Handles `FormData` for file uploads
- Supports multipart/form-data for audio/PDF uploads
- 30-second timeout for all requests (configurable in `client.ts`)

---

**Need help?** Check the API endpoint documentation in `/mobile/api-endpoints-overview.txt`
