# PDF AI Note Generator - Backend Implementation

This backend implements a comprehensive workflow for processing PDF documents and generating AI-powered structured notes using the Vercel AI SDK with Google Gemini.

## 🚀 Workflow Overview

The system follows this complete workflow:

1. **PDF Upload** → User uploads a PDF document
2. **Text Extraction** → Extract text content from PDF and store in database as `Transcript`
3. **AI Processing** → Use Gemini AI to generate structured notes from extracted text
4. **Note Storage** → Store AI-generated notes in database as `Note`
5. **API Access** → Provide REST API endpoints for accessing transcripts and notes

## 📊 Database Schema

### Transcript Model
```prisma
model Transcript {
  id          String   @id @default(cuid())
  fileName    String
  originalName String
  content     String   // Raw extracted text
  cleanContent String  // Cleaned/processed text
  pages       Int
  metadata    Json?
  userId      String?  // Optional user association
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationship to notes
  notes       Note[]
}
```

### Note Model
```prisma
model Note {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text  // AI-generated structured content
  transcriptId String
  userId      String?  // Optional user association
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationship to transcript
  transcript  Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)
}
```

## 🛠 API Endpoints

### Complete Workflow Endpoint

#### `POST /api/pdf/process`
Processes PDF and generates AI notes in one request.

**Request:**
```typescript
FormData {
  file: File,              // PDF file (required)
  extractImages?: boolean, // Extract images from PDF (default: false)
  maxPages?: number,       // Max pages to process (default: all)
  generateNotes?: boolean  // Generate AI notes (default: true)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    transcript: {
      id: string,
      text: string,
      cleanText: string,
      pages: number,
      metadata: object,
      imageCount: number
    },
    note?: {
      id: string,
      title: string,
      content: string,
      transcriptId: string,
      createdAt: string
    } | { error: string, message: string }
  }
}
```

### Individual Workflow Endpoints

#### `POST /api/notes/generate`
Generate AI notes from existing transcript.

**Request:**
```json
{
  "transcriptId": "string"
}
```

#### `GET /api/notes`
Get all notes for authenticated user.

**Query Parameters:**
- `transcriptId` (optional): Filter notes by transcript

#### `GET /api/notes/[id]`
Get specific note by ID.

#### `PUT /api/notes/[id]`
Update note title/content.

#### `DELETE /api/notes/[id]`
Delete note by ID.

## 🤖 AI Note Generation

The system uses Google Gemini AI with a comprehensive prompt that generates structured notes with the following sections:

1. **Overview/Abstract** - Executive summary (150-200 words)
2. **Background and Motivation** - Context and purpose
3. **Detailed Section Analysis** - In-depth content analysis (200-250 words per section)
4. **Key Terms & Definitions** - Technical terminology
5. **Action Items/Next Steps** - Recommendations and follow-ups
6. **Conclusion** - Main findings and impact

### AI Configuration

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const model = google('models/gemini-1.5-flash-latest');
```

Environment variable required:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## 🎯 React Hooks

### `useNotes()`
Comprehensive hook for all note-related operations:

```typescript
const {
  loading,
  error,
  processPDFWithNotes,      // Complete workflow
  generateNotesFromTranscript,
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} = useNotes();
```

## 🎨 React Components

### `PDFProcessor`
Complete PDF upload and processing interface:

```tsx
<PDFProcessor 
  onProcessComplete={(result) => {
    console.log('Transcript:', result.transcript);
    console.log('Generated notes:', result.note);
  }} 
/>
```

### `NotesViewer`
View and manage AI-generated notes:

```tsx
{/* View all user notes */}
<NotesViewer />

{/* View notes for specific transcript */}
<NotesViewer transcriptId="transcript_id" />

{/* View specific note */}
<NotesViewer noteId="note_id" />
```

## 🚦 Usage Examples

### 1. Complete Workflow (Upload + AI Notes)

```typescript
const { processPDFWithNotes } = useNotes();

const result = await processPDFWithNotes(pdfFile, {
  extractImages: false,
  maxPages: 10,
  generateNotes: true
});

console.log('Transcript ID:', result.transcript.id);
console.log('Note ID:', result.note.id);
```

### 2. Generate Notes from Existing Transcript

```typescript
const { generateNotesFromTranscript } = useNotes();

const note = await generateNotesFromTranscript('transcript_id');
console.log('Generated note:', note.title);
```

### 3. Fetch User Notes

```typescript
const { getNotes } = useNotes();

// All user notes
const allNotes = await getNotes();

// Notes for specific transcript
const transcriptNotes = await getNotes('transcript_id');
```

## 🧪 Testing

### Run the complete workflow test:
```bash
bun run test-workflow
```

This tests:
- PDF upload and processing
- Text extraction and database storage  
- AI note generation
- API retrieval of notes

### Demo page:
Visit `/pdf-demo` to test the complete workflow in the browser.

## 🔧 Development Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   DATABASE_URL=your_postgresql_url
   ```

3. **Run database migrations:**
   ```bash
   bun prisma migrate dev
   ```

4. **Start development server:**
   ```bash
   bun run dev
   ```

## 📁 File Structure

```
src/
├── app/api/
│   ├── pdf/
│   │   ├── parse/route.ts           # Original PDF parsing
│   │   └── process/route.ts         # Complete workflow
│   └── notes/
│       ├── route.ts                 # CRUD operations
│       ├── generate/route.ts        # AI generation
│       └── [id]/route.ts           # Individual note ops
├── lib/
│   ├── note-service.ts             # Note business logic
│   ├── document-service.ts         # Document operations
│   └── pdf-parser/index.ts         # PDF processing
├── hooks/
│   └── use-notes.ts                # React hook
└── components/pdf/
    ├── pdf-processor.tsx           # Upload & process UI
    └── notes-viewer.tsx            # Notes display UI
```

## 🔒 Security Features

- **User Authentication** - Uses Clerk for user management
- **Access Control** - Users can only access their own notes
- **Input Validation** - Validates file types and request parameters
- **Error Handling** - Comprehensive error handling and logging

## 🚀 Production Considerations

- **Rate Limiting** - Consider implementing rate limits for AI API calls
- **Caching** - Cache frequently accessed notes
- **Background Processing** - Move AI generation to background jobs for large documents
- **File Storage** - Consider cloud storage for uploaded PDFs
- **Monitoring** - Add logging and monitoring for AI API usage

This implementation provides a complete, production-ready backend for PDF processing and AI note generation with a clean API interface and robust error handling.
