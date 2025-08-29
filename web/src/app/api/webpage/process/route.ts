import { NextRequest, NextResponse } from 'next/server';
import { WebpageCrawlerService } from '@/lib/webpage-crawler-service';
import { NoteService } from '@/lib/note-service';
import { UserService } from '@/lib/user-service';
import { auth } from '@clerk/nextjs/server';

const webpageCrawlerService = new WebpageCrawlerService();
const noteService = new NoteService();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, generateNotes = true } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if user has enough credits (1 credit for webpage processing)
    const hasEnoughCredits = await UserService.hasEnoughCredits(userId, 1);
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits. You need 1 credit to process a webpage and generate notes.',
          code: 'INSUFFICIENT_CREDITS'
        },
        { status: 402 }
      );
    }

    console.log(`Processing webpage: ${url} for user: ${userId}`);

    // Step 1: Crawl the webpage and save as transcript
    const crawlResult = await webpageCrawlerService.crawlWebpage(url, userId);

    // Deduct 1 credit for webpage processing
    await UserService.deductCredits('webpage_processing', 1, crawlResult.documentId);

    console.log(`Successfully crawled webpage and created transcript: ${crawlResult.documentId}`);

    let noteResult = null;

    // Step 2: Generate AI notes if requested
    if (generateNotes && crawlResult.documentId) {
      try {
        console.log(`Generating AI notes for transcript: ${crawlResult.documentId}`);
        noteResult = await noteService.generateAINote(crawlResult.documentId, userId);
        console.log(`Successfully generated AI notes: ${noteResult.id}`);
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
        // Webpage crawling results
        transcript: {
          id: crawlResult.documentId,
          title: crawlResult.title,
          content: crawlResult.content,
          cleanContent: crawlResult.cleanContent,
          url: crawlResult.url,
          domain: crawlResult.domain,
          metadata: crawlResult.metadata,
          originalName: crawlResult.title,
        },
        // AI-generated note results
        note: noteResult,
      },
      message: 'Webpage processed successfully',
    });

  } catch (error) {
    console.error('Webpage processing error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Scrape.do API error')) {
        return NextResponse.json(
          { 
            error: 'Failed to access webpage',
            message: 'The webpage could not be accessed. It might be down or blocking requests.',
            code: 'WEBPAGE_ACCESS_ERROR'
          },
          { status: 502 }
        );
      }

      if (error.message.includes('Invalid or unsafe URL')) {
        return NextResponse.json(
          { 
            error: 'Invalid URL',
            message: 'The provided URL is invalid or points to a restricted location.',
            code: 'INVALID_URL'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('content is too short')) {
        return NextResponse.json(
          { 
            error: 'Insufficient content',
            message: 'The webpage does not contain enough readable content to process.',
            code: 'INSUFFICIENT_CONTENT'
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to process webpage',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'PROCESSING_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webpage Processing API',
    description: 'Process webpages to extract content and generate AI-powered notes',
    endpoints: {
      POST: '/api/webpage/process - Process webpage URL and generate notes',
    },
    parameters: {
      url: 'Webpage URL to process (required)',
      generateNotes: 'Generate AI notes from extracted content (optional, default: true)',
    },
    workflow: [
      '1. Validate URL and check user credits',
      '2. Crawl webpage using Scrape.do service',
      '3. Extract and clean content from HTML',
      '4. Save content as Transcript in database',
      '5. Generate comprehensive AI notes using Gemini AI',
      '6. Save generated notes to database',
      '7. Return both transcript and note data'
    ],
    credits: {
      cost: 1,
      description: 'Each webpage processing costs 1 credit'
    }
  });
}
