# Mobile API Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Import
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /mobile/lib/api/index.ts                      │
│                   (Centralized Exports)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
┌───────────────────┐  ┌──────────────┐  ┌──────────────┐
│   notes.ts        │  │  user.ts     │  │  course.ts   │
│   16 functions    │  │  5 functions │  │  9 functions │
└───────────────────┘  └──────────────┘  └──────────────┘
                              │
┌───────────────────┐  ┌──────────────┐  ┌──────────────┐
│   chapter.ts      │  │  podcast.ts  │  │  pdf.ts      │
│   13 functions    │  │  6 functions │  │  5 functions │
└───────────────────┘  └──────────────┘  └──────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        All modules use common infrastructure:
┌─────────────────────────────────────────────────────────────────┐
│                          client.ts                               │
│                    (Axios Client + Interceptors)                 │
├─────────────────────────────────────────────────────────────────┤
│  • Request Interceptor:                                          │
│    - Add Authorization token from expo-secure-store              │
│    - Set headers                                                 │
│                                                                   │
│  • Response Interceptor:                                         │
│    - Handle errors (401, 403, 404, 500, 503)                    │
│    - Auto-logout on 401                                          │
│    - Network error detection                                     │
│    - Response unwrapping                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API (website/app/api)                       │
│                                                                   │
│  /api/notes/*          /api/chapter/*       /api/course/*       │
│  /api/pdf/*            /api/audio/*         /api/podcast/*      │
│  /api/user/*           /api/subscription/*  /api/transcripts/*  │
│  /api/mindmap/*        /api/documents/*     /api/webpage/*      │
│  /api/search/*                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                         │
│                      Prisma ORM                                  │
└─────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════

                        TYPE SAFETY FLOW

┌─────────────────────────────────────────────────────────────────┐
│                         types.ts                                 │
│                   (TypeScript Definitions)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Models:                    Enums:                               │
│  • Note                     • SubscriptionStatus                 │
│  • Transcript               • PodcastMode                        │
│  • Flashcard                • PodcastStatus                      │
│  • Quiz                     • QualityPreset                      │
│  • Podcast                  • DurationScale                      │
│  • Course                                                        │
│  • Chapter                  Request Types:                       │
│  • User                     • CreateNoteRequest                  │
│  • Subscription             • GenerateFlashcardsRequest          │
│  • MindMap                  • GeneratePodcastRequest             │
│  • Document                 • CreateSubscriptionRequest          │
│  • and more...              • and more...                        │
│                                                                   │
│  Response Types:                                                 │
│  • ApiResponse<T>                                                │
│  • GenerateNoteFromTextResponse                                  │
│  • CreateSubscriptionResponse                                    │
│  • and more...                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Import
                              ▼
                All API modules are fully typed


════════════════════════════════════════════════════════════════════

                      AUTHENTICATION FLOW

┌─────────────────────────────────────────────────────────────────┐
│  1. User logs in (e.g., Clerk authentication)                   │
│     Token saved to: expo-secure-store                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. App makes API call: notesApi.getNotes()                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Request Interceptor:                                         │
│     - Retrieves token from expo-secure-store                     │
│     - Adds: Authorization: Bearer <token>                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Request sent to backend                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Response received                                            │
│     • Success (200): Data returned                               │
│     • Error (401): Token invalid/expired                         │
│       → Remove token from storage                                │
│       → Trigger logout/redirect to login                         │
│     • Error (403): Insufficient permissions                      │
│     • Error (404): Resource not found                            │
│     • Error (500): Server error                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Response Interceptor:                                        │
│     - Unwraps ApiResponse<T> → returns T                         │
│     - Formats error messages                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Data returned to component                                   │
└─────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════

                     FILE UPLOAD FLOW

┌─────────────────────────────────────────────────────────────────┐
│  1. User selects file (audio/PDF)                               │
│     Component gets file URI                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Create FormData:                                             │
│     const formData = new FormData();                             │
│     formData.append('file', {                                    │
│       uri: fileUri,                                              │
│       type: 'audio/m4a',  // or 'application/pdf'               │
│       name: 'file.m4a'                                           │
│     });                                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Call API:                                                    │
│     const result = await audioApi.transcribeAudio(formData);     │
│     // or                                                        │
│     const result = await pdfApi.processPDF(formData);            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Client sets headers:                                         │
│     Content-Type: multipart/form-data                            │
│     Authorization: Bearer <token>                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. File uploaded to backend                                     │
│     Backend processes file                                       │
│     Returns processed data (transcript, etc.)                    │
└─────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════

                   ERROR HANDLING FLOW

┌─────────────────────────────────────────────────────────────────┐
│  API Call → Try/Catch → Response Interceptor                    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         401 Error       403 Error       404 Error
         Unauthorized    Forbidden       Not Found
              │               │               │
              ▼               ▼               ▼
     Clear token &    Show upgrade     Show error
     redirect login      prompt         message
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                     User notified


════════════════════════════════════════════════════════════════════

                    COMPLETE WORKFLOW EXAMPLE
                (Audio → Notes → Study Materials)

┌─────────────────────────────────────────────────────────────────┐
│  1. User records/uploads audio                                   │
│     → audioApi.transcribeAudio(formData)                         │
│     ← Returns: { transcript, transcription }                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Generate AI note from transcript                             │
│     → notesApi.generateAINote({ transcriptId })                  │
│     ← Returns: Note                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Generate flashcards                                          │
│     → notesApi.generateFlashcards({ noteId })                    │
│     ← Returns: Flashcard                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Generate quiz                                                │
│     → notesApi.generateQuiz({ noteId })                          │
│     ← Returns: Quiz                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Generate podcast (optional)                                  │
│     → podcastApi.generatePodcast({ noteId, mode, voices })       │
│     ← Returns: Podcast (status: GENERATING)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Poll podcast status                                          │
│     → podcastApi.getPodcastById(podcastId)                       │
│     ← Returns: Podcast (status: COMPLETED, audioUrl)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. User has complete study materials!                           │
│     • Original transcript                                        │
│     • AI-generated notes                                         │
│     • Flashcards for review                                      │
│     • Quiz for testing                                           │
│     • Podcast for listening                                      │
└─────────────────────────────────────────────────────────────────┘
```

## API Module Organization

```
/mobile/lib/api/
│
├── Core Infrastructure
│   ├── client.ts          # HTTP client with interceptors
│   ├── types.ts           # TypeScript definitions
│   └── index.ts           # Centralized exports
│
├── Content APIs
│   ├── notes.ts           # Notes + AI features
│   ├── transcripts.ts     # Transcript management
│   ├── documents.ts       # Document management
│   └── mindmap.ts         # Mind map generation
│
├── Media APIs
│   ├── audio.ts           # Audio transcription
│   ├── pdf.ts             # PDF processing
│   ├── podcast.ts         # Podcast generation
│   └── webpage.ts         # Web content extraction
│
├── Learning APIs
│   ├── course.ts          # Course management
│   └── chapter.ts         # Chapter content + progress
│
├── User APIs
│   ├── user.ts            # Profile + credits
│   └── subscription.ts    # Subscription management
│
├── Utility APIs
│   └── search.ts          # Semantic search
│
└── Documentation
    ├── README.md          # API documentation
    ├── examples.ts        # Usage examples
    ├── IMPLEMENTATION_SUMMARY.md
    └── ARCHITECTURE.md    # This file
```

## Key Design Principles

1. **Modularity**: Each API module is independent and focused
2. **Type Safety**: 100% TypeScript coverage
3. **Error Handling**: Centralized, consistent error handling
4. **Authentication**: Automatic token management
5. **Developer Experience**: Clean imports, good documentation
6. **Maintainability**: Easy to extend and modify
7. **Production Ready**: Timeouts, retries, logging

## Integration Points

### With Clerk (Authentication)
```typescript
// After Clerk login
await SecureStore.setItemAsync('auth_token', clerkToken);

// Automatic usage in all API calls
// No manual token management needed
```

### With React Query (Data Fetching)
```typescript
const { data: notes } = useQuery({
  queryKey: ['notes'],
  queryFn: () => notesApi.getNotes(),
});
```

### With Zustand (State Management)
```typescript
const useNotesStore = create((set) => ({
  notes: [],
  fetchNotes: async () => {
    const notes = await notesApi.getNotes();
    set({ notes });
  },
}));
```

## Performance Considerations

- ✅ 30-second timeout for all requests
- ✅ Request/response size monitoring
- ✅ Efficient error handling
- ✅ No unnecessary data transformations
- ✅ Direct response unwrapping

## Security Features

- ✅ HTTPS only in production
- ✅ Secure token storage
- ✅ Automatic token refresh handling
- ✅ Input validation at type level
- ✅ XSS protection via type checking

---

**This architecture provides a solid foundation for building a production-ready mobile app with complete backend integration.**
