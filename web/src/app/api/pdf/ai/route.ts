import { NextRequest, NextResponse } from 'next/server';
import { PDFParser } from '@/lib/pdf-parser';
import { join } from 'path';

const uploadDir = join(process.cwd(), 'storage', 'uploads');
const parser = new PDFParser(uploadDir);

export async function POST(request: NextRequest) {
  try {
    const { text, action } = await request.json();
    
    if (!text || !action) {
      return NextResponse.json(
        { error: 'Text and action are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'summary':
        result = await parser.generateSummary(text);
        break;
      case 'quiz':
        result = await parser.generateQuiz(text);
        break;
      case 'flashcards':
        result = await parser.generateFlashcards(text);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: summary, quiz, or flashcards' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });

  } catch (error) {
    console.error('AI processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process with AI',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'PDF AI Processing API',
    endpoints: {
      POST: '/api/pdf/ai - Process extracted text with AI',
    },
    parameters: {
      text: 'Extracted text from PDF (required)',
      action: 'AI action: summary, quiz, or flashcards (required)',
    },
  });
}
