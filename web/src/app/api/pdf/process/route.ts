import { NextRequest, NextResponse } from 'next/server';
import { PDFParser } from '@/lib/pdf-parser';
import { NoteService } from '@/lib/note-service';
import { join } from 'path';
import { auth } from '@clerk/nextjs/server';

const uploadDir = join(process.cwd(), 'storage', 'uploads');
const parser = new PDFParser(uploadDir);
const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Get user ID from authentication
    const { userId } = await auth();

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse options from form data
    const extractImages = formData.get('extractImages') === 'true';
    const maxPages = formData.get('maxPages') ? parseInt(formData.get('maxPages') as string) : undefined;
    const generateNotes = formData.get('generateNotes') !== 'false'; // Default to true

    // Step 1: Extract text from PDF and save to database
    const parseResult = await parser.extractToDatabase(buffer, file.name, {
      extractImages,
      maxPages,
    }, userId || undefined);

    let noteResult = null;

    // Step 2: Generate AI notes if requested
    if (generateNotes && parseResult.documentId) {
      try {
        noteResult = await noteService.generateAINote(parseResult.documentId, userId || undefined);
      } catch (noteError) {
        console.error('Failed to generate AI notes:', noteError);
        // Don't fail the entire request if note generation fails
        
        noteResult = {
          error: 'Failed to generate AI notes',
          message: noteError instanceof Error ? noteError.message : 'Unknown error'
        };
      }
    }

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
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
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
      '3. Generate structured AI summary notes using Gemini AI',
      '4. Save generated notes to database as Note',
      '5. Return both transcript and note data'
    ]
  });
}
