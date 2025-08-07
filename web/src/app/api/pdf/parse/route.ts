import { NextRequest, NextResponse } from 'next/server';
import { PDFParser } from '@/lib/pdf-parser';
import { join } from 'path';
import { auth } from '@clerk/nextjs/server';

const uploadDir = join(process.cwd(), 'storage', 'uploads');
const parser = new PDFParser(uploadDir);

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
    const saveToDatabase = formData.get('saveToDatabase') !== 'false'; // Default to true
    const saveToFiles = formData.get('saveToFiles') === 'true';

    let result;
    
    if (saveToDatabase) {
      // Use database storage (default behavior)
      result = await parser.extractToDatabase(buffer, file.name, {
        extractImages,
        maxPages,
      }, userId || undefined);
    } else if (saveToFiles) {
      // Use file system storage (legacy behavior)
      result = await parser.extractToFiles(buffer, file.name, {
        extractImages,
        maxPages,
      });
    } else {
      // Use in-memory parsing only
      result = await parser.parseFromBuffer(buffer, {
        extractImages,
        maxPages,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: result.documentId,
        text: result.text,
        cleanText: result.cleanText,
        pages: result.pages,
        metadata: result.metadata,
        imageCount: result.images?.length || 0,
        extractedFiles: result.extractedFiles,
      },
    });

  } catch (error) {
    console.error('PDF parsing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to parse PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF Parser API',
    endpoints: {
      POST: '/api/pdf/parse - Upload and parse PDF file',
    },
    parameters: {
      file: 'PDF file to parse (required)',
      extractImages: 'Extract images from PDF (optional, default: false)',
      maxPages: 'Maximum number of pages to parse (optional)',
      saveToDatabase: 'Save extracted content to database (optional, default: true)',
      saveToFiles: 'Save extracted content to files (optional, default: false)',
    },
  });
}
