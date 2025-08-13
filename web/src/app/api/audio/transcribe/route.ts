import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NoteService } from '@/lib/note-service';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const fileName = formData.get('fileName') as string || 'recorded-audio';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check if user has credits before processing audio
    let hasCredits = true;
    if (userId) {
      try {
        const { checkUserHasCredits } = await import('@/lib/usage');
        hasCredits = await checkUserHasCredits();
      } catch (error) {
        console.error('Error checking credits:', error);
        // If there's an error checking credits, assume they have credits
        hasCredits = true;
      }
    }

    // Convert audio to base64
    const bytes = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(bytes).toString('base64');

    // Use Google Generative AI directly
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an expert transcriptionist and content analyst. Please transcribe this audio with exceptional accuracy and create a comprehensive, detailed summary.

    TRANSCRIPTION REQUIREMENTS:
    - Provide a complete, word-for-word transcription
    - Include speaker distinctions if multiple voices are present
    - Capture tone, emphasis, and emotional context through descriptive language
    - Note any background sounds, pauses, or audio quality issues if relevant
    - Use proper punctuation and formatting for readability

    SUMMARY REQUIREMENTS:
    - Create a thorough, multi-paragraph summary that captures all key points
    - MINIMUM 200 WORDS PER TOPIC/SUBTOPIC: Ensure each major topic and subtopic receives at least 200 words of detailed analysis and explanation
    - Include the main topic, subtopics, and supporting details with extensive elaboration
    - Describe the speaker's tone, mood, and communication style with specific examples
    - Identify the purpose/intent of the recording (lecture, meeting, interview, etc.) with detailed context
    - Extract actionable items, key insights, or important conclusions with comprehensive explanations
    - Note any specific terminology, names, dates, or technical details mentioned with background context
    - If content seems brief, expand significantly with contextual analysis, implications, and related concepts
    - Structure the summary with clear sections and detailed bullet points where appropriate
    - Include potential applications or follow-up actions based on the content with thorough justification
    - Provide deep analysis of underlying themes, concepts, and broader implications
    - Add relevant background information and context that would help readers understand the full scope
    - Ensure the total summary is substantial and informative, treating each point with academic-level depth
    - MINIMUM FINAL OUTPUT LENGTH: The complete summary must be at least 10,000 characters (approximately 1,500-2,000 words) to ensure thorough coverage and analysis

    Please format your response exactly as:
    TRANSCRIPT:
    [Complete, detailed transcription with speaker attribution and contextual notes]

    SUMMARY:
    [Comprehensive, structured summary with multiple paragraphs covering all aspects of the audio content]`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioFile.type
        }
      }
    ]);

    const text = result.response.text();

    // Parse the response to extract transcript and summary
    const sections = text.split('SUMMARY:');
    const transcriptSection = sections[0]?.replace('TRANSCRIPT:', '').trim() || text;
    const summarySection = sections[1]?.trim() || 'Summary not available';

    // Save to database
    const transcript = await prisma.transcript.create({
      data: {
        fileName: `${fileName}.${audioFile.name.split('.').pop()}`,
        originalName: audioFile.name,
        content: transcriptSection,
        cleanContent: transcriptSection,
        type: 'audio',
        userId: userId || undefined,
        metadata: {
          fileSize: audioFile.size,
          mimeType: audioFile.type,
          duration: null // Could be extracted if needed
        }
      }
    });

    // Create an instance of NoteService to use its saveNote method which handles indexing
    const noteService = new NoteService();
    
    let noteResult = null;
    
    // Only attempt to create a note if user has credits
    if (hasCredits) {
      try {
        // Create the note using the service to ensure it gets indexed
        const note = await noteService.saveNote({
          title: `Audio Summary: ${fileName}`,
          content: summarySection,
          transcriptId: transcript.id,
          userId: userId || undefined,
          consumeCredits: true // Explicitly consume credits for audio notes
        });
        
        noteResult = {
          id: note.id,
          title: note.title,
          content: note.content
        };
      } catch (error) {
        console.error('Failed to generate AI notes:', error);
        
        // Check if error is related to insufficient credits
        if (error instanceof Error && (error as any).redirectToPricing) {
          noteResult = {
            error: 'Insufficient credits',
            message: error instanceof Error ? error.message : 'Insufficient credits to generate AI note. Please purchase more credits.',
            insufficientCredits: true,
            redirectToPricing: true,
            redirectUrl: '/pricing'
          };
        } else {
          noteResult = {
            error: 'Failed to generate AI notes',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    } else {
      // User has insufficient credits, don't even try to create a note
      noteResult = {
        error: 'Insufficient credits',
        message: 'Insufficient credits to generate AI note. Please purchase more credits.',
        insufficientCredits: true,
        redirectToPricing: true,
        redirectUrl: '/pricing'
      };
    }
    
    // Return the transcript even if note creation failed
    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript.id,
        content: transcriptSection
      },
      note: noteResult
    });

  } catch (error) {
    console.error('Audio transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
