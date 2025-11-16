import { NextRequest, NextResponse } from 'next/server';
import { PDFParser } from '@/lib/pdf-parser';
import { join } from 'path';
import { getUserFromAuth } from '@/lib/auth-helper';

const parser = new PDFParser();

export async function POST(request: NextRequest) {
  try {
     // Parse form data with size limit
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate file presence
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

    // Validate file type more thoroughly
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

    // Check file extension as backup validation
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

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
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

    // Validate filename
    if (!file.name || file.name.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid filename',
          message: 'File must have a valid name.'
        },
        { status: 400 }
      );
    }

    // Get user ID from authentication
    const userId = await getUserFromAuth(request);

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
    const saveToDatabase = formData.get('saveToDatabase') !== 'false'; // Default to true
    const saveToFiles = formData.get('saveToFiles') === 'true';

    let result;
    
    if (saveToDatabase) {
      // Use database storage (default behavior)
      result = await parser.extractToDatabase(buffer, file.name, userId || undefined);
    } else {
      // Use in-memory parsing only
      result = await parser.parseFromBuffer(buffer);
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
    
    // Provide specific error responses based on error type
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('invalid pdf') || errorMessage.includes('corrupted')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid PDF file',
            message: 'The uploaded file is not a valid PDF or is corrupted. Please try a different file.'
          },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Processing timeout',
            message: 'PDF processing timed out. The file may be too large or complex. Please try a smaller file.'
          },
          { status: 408 }
        );
      }
      
      if (errorMessage.includes('password')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Password protected PDF',
            message: 'Password-protected PDFs are not supported. Please upload an unprotected PDF file.'
          },
          { status: 400 }
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
      
      if (errorMessage.includes('null bytes') || errorMessage.includes('invalid characters')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid PDF content',
            message: 'This PDF contains characters that cannot be processed. Please try a different file.'
          },
          { status: 400 }
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
