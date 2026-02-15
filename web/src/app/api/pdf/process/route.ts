import { NextRequest, NextResponse } from 'next/server';
import { PDFParser } from '@/lib/pdf-parser';
import { NoteService } from '@/lib/note-service';
import { FeatureGateService } from '@/lib/feature-gate-service';
import { join } from 'path';
import { getUserFromAuth } from '@/lib/auth-helper';
import { noteProgressManager } from '@/lib/note-progress-manager';

const parser = new PDFParser();
const noteService = new NoteService();

// Configure route segment for large file uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering
export const runtime = 'nodejs'; // Use Node.js runtime for file handling

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const progressJobId = (formData.get('progressJobId') as string | null)?.trim() || '';

    const publishProgress = (
      progress: number,
      stage: 'uploading' | 'processing' | 'generating' | 'completed' | 'error',
      message: string
    ) => {
      if (!progressJobId) {
        return;
      }
      noteProgressManager.publish({
        jobId: progressJobId,
        progress,
        stage,
        message,
      });
    };

    publishProgress(15, 'uploading', 'Extracting PDF...');

    // Enhanced file validation
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
          message: 'Please select a PDF file to upload.'
        },
        { status: 400 }
      );
    }

    // Validate file type and extension
    const allowedMimeTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type',
          message: 'Only PDF files are allowed.'
        },
        { status: 400 }
      );
    }

    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file extension',
          message: 'File must have a .pdf extension.'
        },
        { status: 400 }
      );
    }

    // Validate file size (20MB limit)
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large',
          message: `File size must be less than ${maxFileSize / 1024 / 1024}MB.`
        },
        { status: 413 }
      );
    }

    // Get user ID from authentication
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Please sign in to process PDF files.'
        },
        { status: 401 }
      );
    }

    // Check note creation access (allows free tier: 1 note)
    const accessCheck = await FeatureGateService.checkNoteCreationAccess();
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: accessCheck.error,
          message: accessCheck.message,
          notesUsed: accessCheck.notesUsed,
          notesLimit: accessCheck.notesLimit,
          upgradeUrl: accessCheck.upgradeUrl || '/pricing',
        },
        { status: accessCheck.statusCode }
      );
    }

    // Convert file to buffer with error handling
    let buffer: Buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'File processing failed',
          message: 'Unable to read the uploaded file. Please try again.'
        },
        { status: 400 }
      );
    }

    // Parse and validate options from form data
    const extractImages = formData.get('extractImages') === 'true';
    const maxPagesParam = formData.get('maxPages');
    const maxPages = maxPagesParam ? Math.min(parseInt(maxPagesParam as string) || 50, 50) : undefined;
    const generateNotes = formData.get('generateNotes') === 'true'; // Require explicit opt-in
    const folderId = formData.get('folderId') as string | null;

    // Step 1: Extract text from PDF and save to database
    let parseResult;
    try {
      publishProgress(40, 'processing', 'Parsing PDF...');
      parseResult = await parser.extractToDatabase(buffer, file.name, userId);
    } catch (parseError) {
      console.error('PDF parsing failed:', parseError);
      publishProgress(0, 'error', 'Failed while parsing PDF');

      // Don't deduct credits if parsing fails
      if (parseError instanceof Error) {
        const errorMessage = parseError.message.toLowerCase();

        if (errorMessage.includes('invalid pdf') || errorMessage.includes('corrupted')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid PDF file',
              message: 'The uploaded file is not a valid PDF or is corrupted.'
            },
            { status: 400 }
          );
        }

        if (errorMessage.includes('timeout')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Processing timeout',
              message: 'PDF processing timed out. Please try a smaller file.'
            },
            { status: 408 }
          );
        }

        if (errorMessage.includes('password')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Password protected',
              message: 'Password-protected PDFs are not supported.'
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'PDF processing failed',
          message: parseError instanceof Error ? parseError.message : 'Failed to process PDF'
        },
        { status: 500 }
      );
    }

    // Only deduct credits after successful parsing
    // Note: With subscription system, no credit deduction needed
    // Access is controlled by active subscription status

    // Increment PDF processing usage counter after successful parsing
    await FeatureGateService.incrementPdfUsage(userId);

    let noteResult = null;

    // Step 2: Generate AI notes if requested
    if (generateNotes && parseResult.documentId) {
      try {
        const reservation = await FeatureGateService.reserveNoteUsage(userId);
        if (!reservation.allowed) {
          noteResult = {
            error: reservation.error || 'FREE_TIER_LIMIT_REACHED',
            message: reservation.message || 'Unable to create note',
            notesUsed: reservation.notesUsed,
            notesLimit: reservation.notesLimit,
            upgradeUrl: reservation.upgradeUrl || '/pricing',
          };
        } else {
          publishProgress(60, 'generating', 'Indexing...');
          publishProgress(75, 'generating', 'Chunking...');
          noteResult = await noteService.generateAINote(parseResult.documentId, userId, folderId || undefined);
        }
      } catch (noteError) {
        console.error('Failed to generate AI notes:', noteError);
        publishProgress(0, 'error', 'Failed while generating note');
        
        // Decrement counter since note creation failed
        await FeatureGateService.decrementNoteUsage(userId);
        
        // Don't fail the entire request if note generation fails

        if (noteError instanceof Error) {
          const errorMessage = noteError.message.toLowerCase();

          if (errorMessage.includes('overloaded') || errorMessage.includes('quota')) {
            noteResult = {
              modelOverloaded: true,
              message: 'AI service is currently busy. Your PDF was processed successfully, but AI notes could not be generated at this time.'
            };
          } else {
            noteResult = {
              error: 'Failed to generate AI notes',
              message: noteError.message
            };
          }
        } else {
          noteResult = {
            error: 'Failed to generate AI notes',
            message: 'Unknown error occurred during note generation'
          };
        }
      }
    }

    publishProgress(100, 'completed', 'Finishing...');

    return NextResponse.json({
      success: true,
      data: {
        // PDF parsing results
        transcript: {
          id: parseResult.documentId,
          text: parseResult.text,
          cleanText: parseResult.cleanText,
          pages: parseResult.pages,
          metadata: parseResult.metadata,
          imageCount: parseResult.images?.length || 0,
          extractedFiles: parseResult.extractedFiles,
        },
        // AI-generated note results
        note: noteResult,
      },
    });

  } catch (error) {
    console.error('PDF processing error:', error);

    // Provide specific error responses
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication failed',
            message: 'Please sign in and try again.'
          },
          { status: 401 }
        );
      }

      if (errorMessage.includes('credits') || errorMessage.includes('insufficient')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient credits',
            message: 'You need more credits to process PDF files.'
          },
          { status: 402 }
        );
      }

      if (errorMessage.includes('database') || errorMessage.includes('prisma')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Unable to save PDF content. Please try again later.'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'PDF processing failed',
        message: 'An unexpected error occurred while processing the PDF. Please try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'PDF Processing with AI Notes API',
    endpoints: {
      POST: '/api/pdf/process - Upload PDF, extract text, and generate AI notes',
    },
    parameters: {
      file: 'PDF file to process (required)',
      extractImages: 'Extract images from PDF (optional, default: false)',
      maxPages: 'Maximum number of pages to parse (optional)',
      generateNotes: 'Generate AI notes from extracted text (optional, default: true)',
    },
    workflow: [
      '1. Upload PDF file',
      '2. Extract text content and save to database as Transcript',
      '3. Generate structured AI summary notes using OpenAI',
      '4. Save generated notes to database as Note',
      '5. Return both transcript and note data'
    ]
  });
}
