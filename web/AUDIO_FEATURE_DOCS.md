# 🔊 Audio Transcription & Summary Feature

This document describes the audio transcription and summary feature implemented in the dashboard.

## 🎯 Overview

The audio feature allows users to:
- **Record live audio** using the browser's MediaRecorder API
- **Upload audio files** (.mp3, .wav, .m4a, etc.)
- **Transcribe audio** using Google's Gemini AI model
- **Generate intelligent summaries** of the audio content
- **Save transcripts and summaries** to the database

## 🔧 Implementation Details

### Frontend Components

#### AudioRecorder Component (`/components/audio/audio-recorder.tsx`)
- **Live Recording**: Uses `MediaRecorder` API for browser-based recording
- **File Upload**: Supports various audio formats
- **Audio Preview**: Play/stop functionality for recorded/uploaded audio
- **Processing UI**: Loading states and progress indicators
- **Error Handling**: User-friendly error messages

#### Integration with Dashboard
- Integrated into `/dashboard` route via `new-note-section.tsx`
- Modal dialog interface for better UX
- Consistent with existing PDF and web link features

### Backend API

#### Audio Transcription Route (`/api/audio/transcribe/route.ts`)
- **Endpoint**: `POST /api/audio/transcribe`
- **Input**: FormData with audio file and optional filename
- **Processing**: 
  - Converts audio to base64 encoding
  - Sends to Google Gemini 1.5 Flash model
  - Parses structured response (transcript + summary)
- **Output**: JSON with transcript and note data
- **Authentication**: Uses Clerk for user authentication
- **Database**: Saves to PostgreSQL via Prisma

### Database Schema

#### Updated Transcript Model
```prisma
model Transcript {
  id          String   @id @default(cuid())
  fileName    String
  originalName String
  content     String
  cleanContent String
  pages       Int?     // Optional for audio (null for audio files)
  type        String   @default("pdf") // "pdf" or "audio"
  metadata    Json?    // Stores file size, mime type, etc.
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  notes       Note[]
}
```

#### Note Model
- Stores the AI-generated summary
- Links to the transcript record
- Contains structured analysis of audio content

## 🚀 Usage

### Recording Audio
1. Click "Audio Transcription" button in dashboard
2. Grant microphone permissions when prompted
3. Click "Start Recording" to begin
4. Click "Stop Recording" when finished
5. Preview the audio if needed
6. Add optional filename
7. Click "Transcribe & Generate Summary"

### Uploading Audio Files
1. Click "Audio Transcription" button in dashboard
2. Choose "Upload Audio File" option
3. Select audio file from device
4. Add optional filename
5. Click "Transcribe & Generate Summary"

## 🤖 AI Processing

### Gemini AI Integration
- **Model**: Google Gemini 1.5 Flash
- **Input**: Base64-encoded audio data
- **Prompt**: Structured prompt for transcription and summarization
- **Output**: Formatted response with transcript and detailed summary

### Prompt Engineering
The AI is instructed to:
- Provide accurate transcription
- Generate detailed summaries
- Infer context for short/unclear content
- Structure output for clarity
- Include tone and intent analysis

## 🗄️ Data Storage

### Transcript Record
- Raw transcription text
- File metadata (size, type, name)
- User association (if authenticated)
- Audio-specific type classification

### Note Record
- AI-generated summary
- Structured analysis
- Title generation
- Link to source transcript

## 🔒 Security & Authentication

- **User Authentication**: Clerk integration
- **File Validation**: Size and type checking
- **API Protection**: Server-side validation
- **Data Privacy**: User-scoped data access

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Feedback**: Recording indicators and timers
- **Audio Preview**: Play/pause functionality
- **Loading States**: Processing indicators
- **Error Handling**: Clear error messages
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 Technical Stack

### Frontend
- **React 19** with Next.js 15
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **Lucide React** icons

### Backend
- **Next.js API Routes** for server logic
- **Google Generative AI** (@google/generative-ai)
- **Prisma** ORM for database operations
- **PostgreSQL** database (Neon)
- **Clerk** for authentication

### Development
- **Bun** package manager and runtime
- **Turbopack** for fast development builds
- **ESLint** for code quality

## 🚦 Error Handling

### Frontend Errors
- Microphone access denied
- Unsupported file formats
- Network connectivity issues
- File size limitations

### Backend Errors
- API key configuration issues
- Database connection problems
- AI processing failures
- Authentication errors

## 📈 Future Enhancements

### Potential Improvements
- **Speaker Diarization**: Identify different speakers
- **Language Detection**: Auto-detect audio language
- **Batch Processing**: Multiple file uploads
- **Audio Duration Extraction**: Display file length
- **Noise Reduction**: Pre-processing for clarity
- **Export Options**: Download transcripts as text/PDF
- **Search Functionality**: Full-text search across transcripts

### Performance Optimizations
- **Streaming Processing**: Real-time transcription
- **Caching**: Cache frequently accessed transcripts
- **Compression**: Optimize audio file sizes
- **CDN Integration**: Faster file uploads

## 🧪 Testing

### Manual Testing Checklist
- [ ] Record audio using microphone
- [ ] Upload various audio file formats
- [ ] Test with different audio lengths
- [ ] Verify database storage
- [ ] Test error scenarios
- [ ] Check mobile responsiveness
- [ ] Validate authentication flows

### Automated Testing (Future)
- Unit tests for components
- Integration tests for API routes
- End-to-end testing with Playwright
- Audio processing validation

## 📋 Configuration

### Environment Variables
```env
# Google AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Database
DATABASE_URL=your_postgresql_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Required Permissions
- Microphone access for recording
- File system access for uploads
- Network access for API calls

## 🐛 Troubleshooting

### Common Issues
1. **"Microphone not accessible"**: Check browser permissions
2. **"Upload failed"**: Verify file size and format
3. **"Transcription error"**: Check Google API key and quota
4. **"Database error"**: Verify database connection and schema

### Debug Steps
1. Check browser console for client errors
2. Review server logs for API errors
3. Verify environment variables
4. Test database connectivity
5. Validate Google AI API access

## 📝 License & Credits

This feature integrates several open-source and commercial services:
- Google Generative AI for transcription
- Clerk for authentication
- Prisma for database ORM
- Various React libraries for UI components
