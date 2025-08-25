# Credit System Update

## New Credit Flow

### Credit Deductions (Trigger Points)

1. **YouTube Video Upload + Transcription + Notes** - **1 Credit**
   - Route: `/api/transcripts` (POST) - YouTube URL processing
   - Route: `/api/chapter/getInfo` (POST) - Chapter video processing + notes
   - Includes: Video transcription + AI-generated notes
   - Notes linked to the video are part of the same credit usage

2. **Audio Upload + Transcription + Notes** - **1 Credit**
   - Route: `/api/audio/transcribe` (POST) - Audio file processing
   - Includes: Audio transcription + AI-generated notes
   - Both recorded and uploaded audio files

3. **Course Generation** - **2 Credits**
   - Route: `/api/course/create-course` (POST)
   - Includes: Full course structure with units and chapters
   - More resource-intensive, hence higher cost
   - Credit check added to course creation wizard

4. **PDF Processing** - **1 Credit** (unchanged)
   - Route: `/api/pdf/process` (POST)
   - Includes: PDF text extraction + AI notes generation

5. **Text-to-Notes Generation** - **1 Credit** (unchanged)
   - Route: `/api/notes/generate-from-text` (POST)
   - Creating new content from raw text input

### Free Features (No Credit Cost)

1. **Flashcard Generation**
   - Route: `/api/notes/generate-flashcards` (POST)
   - Route: `/api/chapter/[chapterId]/flashcards` (POST)
   - Free once content exists

2. **Quiz Generation**
   - Route: `/api/notes/generate-quiz` (POST)
   - Free once content exists

3. **Transcript Access**
   - Route: `/api/chapter/[chapterId]/transcript` (GET)
   - Free access to existing transcripts

4. **Notes from Existing Content**
   - Route: `/api/notes/generate` (POST) - Notes from existing transcripts
   - Route: `/api/notes/generate-focused` (POST) - Focused notes from existing transcripts
   - Free once transcript exists

## Implementation Changes

### Updated Routes

1. **Added Credit Checks:**
   - `/api/transcripts` - Added 1 credit check for YouTube processing
   - `/api/chapter/getInfo` - Added 1 credit check for video processing
   - `/api/course/create-course` - Added 2 credit check for course generation
   - `/api/audio/transcribe` - Added 1 credit check for audio processing

2. **Removed Credit Checks:**
   - `/api/notes/generate-flashcards` - Removed credit deduction
   - `/api/notes/generate-quiz` - Removed credit deduction
   - `/api/notes/generate` - Removed credit deduction
   - `/api/notes/generate-focused` - Removed credit deduction

3. **Unchanged (Still Cost Credits):**
   - `/api/pdf/process` - Still costs 1 credit
   - `/api/notes/generate-from-text` - Still costs 1 credit

4. **Free Routes (No Credits Required):**
   - `/api/course/generate-units` - Free (intermediate step)
   - `/api/course/generate-chapters` - Free (intermediate step)
   - `/api/chapter/[chapterId]/flashcards` - Free
   - `/api/chapter/[chapterId]/transcript` - Free
   - `/api/chatbot` - Free (querying existing content)

### Credit Actions

- `youtube_transcription` - 1 credit
- `youtube_video_processing` - 1 credit  
- `audio_transcription` - 1 credit
- `course_generation` - 2 credits
- `pdf_processing` - 1 credit (unchanged)
- `text_to_notes` - 1 credit (unchanged)

## User Experience

- Users are charged only at content creation trigger points
- Once content exists, all derivative features (flashcards, quizzes, etc.) are free
- Clear error messages when insufficient credits (402 status code)
- Credit balance updates immediately after operations
- Upfront credit checking in course creation wizard (2 credits required)
- Enhanced client-side credit checking with specific requirements
- Automatic redirect to credits page when insufficient credits

## Client-Side Integration

- Updated `checkCreditsAndRedirect()` to support different credit requirements
- Added `getCurrentCredits()` for real-time balance checking
- Enhanced error messages with specific credit requirements
- Course creation wizard shows credit requirements upfront