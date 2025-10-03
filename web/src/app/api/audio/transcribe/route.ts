import { NextRequest, NextResponse } from 'next/server';
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { UserService } from '@/lib/user-service';
import { NoteService } from '@/lib/note-service';

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

    // Check file size limit (OpenAI Whisper has a 25MB limit)
    const maxFileSize = 25 * 1024 * 1024; // 25MB in bytes
    if (audioFile.size > maxFileSize) {
      return NextResponse.json({ 
        error: `Audio file is too large. Maximum size allowed is 25MB. Your file is ${(audioFile.size / 1024 / 1024).toFixed(2)}MB.`,
        maxSizeMB: 25,
        currentSizeMB: Number((audioFile.size / 1024 / 1024).toFixed(2))
      }, { status: 413 });
    }

    // Validate file type
    const allowedMimeTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
      'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/mp4'
    ];
    
    if (!allowedMimeTypes.includes(audioFile.type)) {
      return NextResponse.json({ 
        error: `Unsupported audio format: ${audioFile.type}. Supported formats: MP3, WAV, FLAC, M4A, OGG, WebM, MP4.` 
      }, { status: 400 });
    }

    // Check if user has enough credits (1 credit for audio transcription + notes)
    const hasEnoughCredits = await UserService.hasEnoughCredits(userId, 1);
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. You need 1 credit to process audio files and generate notes.' },
        { status: 402 }
      );
    }

    // Step 1: Use AI SDK for audio transcription with Whisper
    console.log('Transcribing audio with AI SDK Whisper...');
    
    // Convert File to Buffer for AI SDK
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    const transcriptionResult = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: audioBuffer,
    });

    const transcriptText = transcriptionResult.text;
    console.log('Transcription completed successfully');

    // Save transcript to database
    const transcriptRecord = await prisma.transcript.create({
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
    await UserService.deductCredits('audio_transcription', 1, transcriptRecord.id);

    // Initialize NoteService
    const noteService = new NoteService();
    let noteResult = null;
    
    try {
      // Use the NoteService directly (same pattern as PDF and webpage processing)
      console.log('Generating notes using NoteService...');
      noteResult = await noteService.generateAINote(transcriptRecord.id, userId);
      console.log('Notes generation completed successfully');
    } catch (error) {
      console.error('Failed to generate AI notes:', error);
      noteResult = {
        error: 'Failed to generate AI notes',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Return the transcript and note results
    return NextResponse.json({
      success: true,
      transcript: {
        id: transcriptRecord.id,
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
