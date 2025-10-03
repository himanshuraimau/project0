import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NoteService } from '@/lib/note-service';
import { UserService } from '@/lib/user-service';

// Initialize OpenAI for Whisper transcription and GPT for summary
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
}

const openai = new OpenAI({ apiKey: openaiApiKey });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const fileName = formData.get('fileName') as string || 'recorded-audio';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check if user has enough credits (1 credit for audio transcription + notes)
    const hasEnoughCredits = await UserService.hasEnoughCredits(userId, 1);
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. You need 1 credit to process audio files and generate notes.' },
        { status: 402 }
      );
    }

    // Step 1: Use OpenAI Whisper for audio transcription
    console.log('Transcribing audio with OpenAI Whisper...');
    
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
      temperature: 0.0, // More deterministic transcription
    });

    const transcriptText = transcriptionResponse;
    console.log('Transcription completed successfully');

    // Step 2: Use OpenAI GPT to generate a comprehensive summary
    console.log('Generating summary with OpenAI GPT...');
    
    const summaryPrompt = `You are an expert content analyst. Based on the following audio transcription, create a comprehensive, detailed summary.

TRANSCRIPTION:
${transcriptText}

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
- MINIMUM FINAL OUTPUT LENGTH: The complete summary must be at least 1,500-2,000 words to ensure thorough coverage and analysis

Provide a comprehensive, structured summary with multiple paragraphs covering all aspects of the audio content.`;

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a cost-effective but capable model
      messages: [
        {
          role: "system",
          content: "You are an expert content analyst specializing in creating comprehensive summaries from audio transcriptions."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      temperature: 0.3, // Slightly creative but focused
      max_tokens: 4000, // Allow for comprehensive summaries
    });

    const summaryText = summaryResponse.choices[0]?.message?.content || 'Summary generation failed';
    console.log('Summary generation completed successfully');    // Save to database
    const transcript = await prisma.transcript.create({
      data: {
        fileName: `${fileName}.${audioFile.name.split('.').pop()}`,
        originalName: audioFile.name,
        content: transcriptText,
        cleanContent: transcriptText,
        type: 'audio',
        userId: userId,
        metadata: {
          fileSize: audioFile.size,
          mimeType: audioFile.type,
          duration: null // Could be extracted if needed
        }
      }
    });

    // Deduct 1 credit for audio transcription + notes generation
    await UserService.deductCredits('audio_transcription', 1, transcript.id);

    // Create an instance of NoteService to use its saveNote method which handles indexing
    const noteService = new NoteService();
    
    let noteResult = null;
    
    try {
      // Create the note using the service to ensure it gets indexed
      const note = await noteService.saveNote({
        title: `Audio Summary: ${fileName}`,
        content: summaryText,
        transcriptId: transcript.id,
        userId: userId
      });
      
      noteResult = {
        id: note.id,
        title: note.title,
        content: note.content
      };
    } catch (error) {
      console.error('Failed to generate AI notes:', error);
      noteResult = {
        error: 'Failed to generate AI notes',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Return the transcript even if note creation failed
    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript.id,
        content: transcriptText
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
