# Generate Note from Text/PDF Feature

## Overview
This feature allows users to create notes directly from text input or PDF files without requiring an audio/video transcript. It uses the `generateNoteFromText` API endpoint which automatically creates a transcript record for the text content.

## Implementation Date
November 16, 2025

## User Flow

1. **Access**: Home screen → Tap "+" button → Select "Upload text or PDF"
2. **Input**: 
   - Enter title (optional - auto-generated from PDF name if empty)
   - Enter text content OR select PDF file(s) OR both
3. **Submit**: Tap "Create Note" button
4. **Success**: See success alert with options to view note or continue
5. **Result**: Note is created and appears in notes list

## Technical Implementation

### API Endpoint Used
**`POST /api/notes/generate-from-text`**

This endpoint:
- Creates a transcript record from the text content
- Generates a note linked to that transcript
- Returns both the transcript and note objects
- Handles subscription/feature gate checks

### Request Format
```typescript
{
  title: string;    // Note title
  text: string;     // Text content (can include PDF info)
}
```

### Response Format
```typescript
{
  transcript: {
    id: string;
    title: string;
    // ... other transcript fields
  };
  note: {
    id: string;
    title: string;
    content: string;
    transcriptId: string;
    // ... other note fields
  };
}
```

## Code Changes

### 1. Mobile Component: `UploadTextOrPDF.tsx`

**File**: `/mobile/components/home/UploadTextOrPDF.tsx`

**Key Changes**:
- Updated `handleGenerateNote` function to use `generateNoteFromText` instead of `createNote`
- Simplified validation (only requires content - text OR PDF)
- Auto-generates title from PDF filename if not provided
- Changed variable name from `content` to `text` to match API
- Added logging for transcript creation

**Function Signature**:
```typescript
const handleGenerateNote = async () => {
  // Validation
  const hasTextContent = textValue.trim().length > 0;
  const hasPDFs = selectedPDFs.length > 0;
  
  if (!hasTextContent && !hasPDFs) {
    Alert.alert('Missing Content', 'Please enter text or select PDFs');
    return;
  }
  
  // Auto-generate title
  let title = titleValue.trim() || 
              (hasPDFs ? selectedPDFs[0].name.replace('.pdf', '') : 'Untitled Note');
  
  // Prepare content
  let text = textValue.trim();
  if (hasPDFs) {
    const pdfInfo = selectedPDFs.map(pdf => `[PDF: ${pdf.name}]`).join('\n\n');
    text = text ? `${text}\n\n--- Attached PDFs ---\n${pdfInfo}` : pdfInfo;
  }
  
  // API Call
  const response = await notesApi.generateNoteFromText({ title, text });
  
  // Success handling
  router.push(`/notes/${response.note.id}`);
}
```

### 2. API Client: Already Configured

**File**: `/mobile/lib/api/notes.ts` (Line 106-124)

The `generateNoteFromText` function already exists:
```typescript
export const generateNoteFromText = async (
  data: GenerateNoteFromTextRequest
): Promise<GenerateNoteFromTextResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<GenerateNoteFromTextResponse>>(
      '/notes/generate-from-text',
      data,
      { timeout: 120000 }  // 120 second timeout for AI generation
    );
    return handleApiResponse<GenerateNoteFromTextResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};
```

### 3. Type Definitions: Already Configured

**File**: `/mobile/lib/api/types.ts` (Line 253-260)

```typescript
export interface GenerateNoteFromTextRequest {
  text: string;
  title: string;
}

export interface GenerateNoteFromTextResponse {
  transcript: Transcript;
  note: Note;
}
```

## Why This Approach?

### ✅ Advantages Over Making TranscriptId Optional

1. **No Schema Changes**
   - Keeps database schema unchanged
   - No migration required
   - No risk to existing data

2. **Uses Purpose-Built Endpoint**
   - `/notes/generate-from-text` is designed for this exact use case
   - Backend handles transcript creation automatically
   - Cleaner separation of concerns

3. **Maintains Data Integrity**
   - Every note still has a transcript (as per schema)
   - Transcript just contains the text input instead of audio/video
   - Consistent data model across all notes

4. **No Breaking Changes**
   - All existing code continues to work
   - Audio/video transcription flow unchanged
   - Other endpoints unaffected

5. **Better Semantics**
   - "Generate note from text" is clearer than "create note without transcript"
   - API name reflects the action
   - Easier to maintain and understand

## Supported Scenarios

### Scenario 1: Text Only ✅
```
Title: "My Study Notes"
Text: "Key concepts from today's lecture..."
PDFs: (none)
→ Creates note with title and text content
```

### Scenario 2: PDF Only ✅
```
Title: (empty)
Text: (empty)
PDFs: ["research-paper.pdf"]
→ Creates note with title "research-paper" and content "[PDF: research-paper.pdf]"
```

### Scenario 3: Text + PDF ✅
```
Title: "Research Summary"
Text: "This paper discusses..."
PDFs: ["paper.pdf"]
→ Creates note combining text and PDF info
```

### Scenario 4: Multiple PDFs ✅
```
Title: "Literature Review"
Text: (optional)
PDFs: ["paper1.pdf", "paper2.pdf"]
→ Creates note listing all PDFs
```

## UI Behavior

### Dynamic Labels
- **Title field**: Shows "(Optional - will use PDF name if empty)" when PDF is selected
- **Text field**: Shows "(Optional)" when PDF is selected
- Both fields show `*` (required) when no PDF is selected

### Loading States
- Button text changes to "Creating..." during API call
- ActivityIndicator shown in button
- All inputs disabled during creation
- Close button disabled

### Success Flow
Alert with two options:
1. **"View Note"**: Navigates to the newly created note
2. **"OK"**: Clears form, refreshes notes list, closes modal

### Error Handling
- Validation errors: Alert dialog with specific message
- API errors: Error banner + alert dialog
- Console logging for debugging

## Backend Processing

The `/notes/generate-from-text` endpoint:

1. **Validates Input**
   - Checks authentication
   - Validates text content exists
   - Checks subscription/feature gate access

2. **Creates Transcript**
   ```typescript
   const transcript = await prisma.transcript.create({
     data: {
       userId,
       fileName: `${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`,
       text: text,
       title: title || "Text Input",
       duration: 0,
       wordCount: text.split(/\s+/).length,
     }
   });
   ```

3. **Generates Note**
   - Uses AI to format/enhance the content (optional)
   - Creates note record linked to transcript
   - Returns both objects

4. **Feature Gates**
   - Checks if user has active subscription
   - Enforces usage limits
   - Returns appropriate error if not allowed

## Console Output

When creating a note, you'll see:
```
Creating note with PDFs: ["paper.pdf"]
PDF URIs for future processing: ["file:///path/to/paper.pdf"]
Creating note with: { title: "My Note", textLength: 150 }
Note created successfully: cm4abc123xyz
Transcript created: cm4def456uvw
```

## Future Enhancements

### 1. PDF Text Extraction
Currently PDFs are stored as `[PDF: filename.pdf]` placeholder.

**Next Steps**:
- Install PDF parsing library (e.g., `react-native-pdf` or `expo-document-picker` with extraction)
- Extract actual text content from PDFs
- Include extracted text in note content

### 2. PDF Upload to Backend
**Implementation**:
```typescript
const formData = new FormData();
selectedPDFs.forEach((pdf, index) => {
  formData.append(`file${index}`, {
    uri: pdf.uri,
    type: 'application/pdf',
    name: pdf.name,
  });
});

const uploadResponse = await apiClient.post('/upload-pdf', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

### 3. Backend PDF Processing
- Store PDFs in cloud storage (S3, etc.)
- Extract text server-side using PDF libraries
- Run AI analysis on PDF content
- Generate structured notes from extracted text

### 4. Progress Indicators
- Show upload progress for large PDFs
- Display extraction progress
- Real-time status updates

### 5. PDF Preview
- Show first page thumbnail
- Display page count
- Preview content before upload

## Testing

### Manual Testing Steps

1. **Text Only**
   - Enter title and text → Tap Create Note → Verify success

2. **PDF Only**
   - Select PDF without title → Tap Create Note → Verify auto-title

3. **Both**
   - Enter text and select PDF → Verify combined content

4. **Multiple PDFs**
   - Select 2+ PDFs → Verify all listed in note

5. **Error Cases**
   - Empty form → Verify validation error
   - Network error → Verify error handling
   - Large content → Verify timeout handling

### Console Verification
Check terminal for:
- PDF selection logs
- API request logs
- Success/error responses
- Created note and transcript IDs

## Known Limitations

1. **PDF Content**
   - Currently stores filename only, not actual text
   - No preview or thumbnail
   - No page count displayed

2. **File Size**
   - No file size validation yet
   - Large PDFs might cause timeout
   - No progress indicator for uploads

3. **Offline Support**
   - Requires network connection
   - No offline queue for creation

4. **Subscription Check**
   - Backend enforces subscription limits
   - Users need active subscription for this feature

## Related Files

### Mobile
- `/mobile/components/home/UploadTextOrPDF.tsx` - Main component
- `/mobile/components/home/index.tsx` - Parent component
- `/mobile/lib/api/notes.ts` - API functions
- `/mobile/lib/api/types.ts` - Type definitions
- `/mobile/PDF_IMPORT_FEATURE.md` - PDF selection docs

### Backend
- `/web/src/app/api/notes/generate-from-text/route.ts` - API endpoint
- `/web/src/lib/note-service.ts` - Business logic
- `/web/src/lib/feature-gate-service.ts` - Subscription checks
- `/web/prisma/schema.prisma` - Database schema (unchanged)

## Migration Impact

✅ **No database migration needed**
✅ **No breaking changes**
✅ **Backward compatible**
✅ **Production safe**

This implementation leverages existing infrastructure without requiring schema changes or migrations, making it a safe and clean solution.
