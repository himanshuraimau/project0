import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getUserFromAuth } from '@/lib/auth-helper';
import { FeatureGateService } from '@/lib/feature-gate-service';
import { NoteService } from '@/lib/note-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromAuth(req);
    
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
      'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/mp4',
      'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'
    ];
    
    console.log('Received audio file with MIME type:', audioFile.type);
    
    if (!allowedMimeTypes.includes(audioFile.type)) {
      return NextResponse.json({ 
        error: `Unsupported audio format: ${audioFile.type}. Supported formats: MP3, WAV, FLAC, M4A, OGG, WebM, MP4.` 
      }, { status: 400 });
    }

    // Check subscription access
    const accessCheck = await FeatureGateService.checkAccessForAPI();
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { 
          error: accessCheck.message,
          upgradeUrl: '/dashboard',
        },
        { status: accessCheck.statusCode }
      );
    }

    // Step 1: Use OpenAI Whisper for audio transcription
    console.log('Transcribing audio with OpenAI Whisper...');
    console.log('Audio file MIME type:', audioFile.type);
    console.log('Audio file name:', audioFile.name);
    console.log('Audio file size:', audioFile.size);
    
    // Map MIME type to file extension for OpenAI
    const mimeToExtension: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/flac': 'flac',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/mp4': 'mp4',
    };
    
    // Get file extension from MIME type or filename
    let fileExtension = mimeToExtension[audioFile.type.toLowerCase()];
    if (!fileExtension) {
      // Fallback to extracting from filename
      const fileNameParts = audioFile.name.split('.');
      fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    }
    
    console.log('Using file extension for transcription:', fileExtension);
    
    // Create proper filename with extension for OpenAI to detect format
    const properFileName = audioFile.name.includes('.') 
      ? audioFile.name 
      : `audio.${fileExtension}`;
    
    console.log('Sending to OpenAI with filename:', properFileName);
    
    // OpenAI SDK expects a File object with proper name
    const audioFileWithName = new File(
      [await audioFile.arrayBuffer()],
      properFileName,
      { type: audioFile.type }
    );
    
    const transcriptionResult = await openai.audio.transcriptions.create({
      file: audioFileWithName,
      model: 'whisper-1',
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

    // No credit deduction needed - subscription system handles access
    
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
      // Don't fail the entire request if note generation fails
      // Return transcript so user can retry note generation
      return NextResponse.json({
        success: true,
        data: {
          transcription: transcriptText,
          transcript: {
            id: transcriptRecord.id,
            fileName: transcriptRecord.fileName,
            originalName: transcriptRecord.originalName,
            content: transcriptText,
            cleanContent: transcriptText,
            type: transcriptRecord.type,
            createdAt: transcriptRecord.createdAt,
            updatedAt: transcriptRecord.updatedAt,
          },
          note: null,
          noteError: error instanceof Error ? error.message : 'Failed to generate notes'
        }
      });
    }
    
    // Return the transcript and note results
    return NextResponse.json({
      success: true,
      data: {
        transcription: transcriptText,
        transcript: {
          id: transcriptRecord.id,
          fileName: transcriptRecord.fileName,
          originalName: transcriptRecord.originalName,
          content: transcriptText,
          cleanContent: transcriptText,
          type: transcriptRecord.type,
          createdAt: transcriptRecord.createdAt,
          updatedAt: transcriptRecord.updatedAt,
        },
        note: noteResult
      }
    });

  } catch (error) {
    console.error('Audio transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
