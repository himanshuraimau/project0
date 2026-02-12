import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getUserFromAuth } from '@/lib/auth-helper';
import { FeatureGateService } from '@/lib/feature-gate-service';
import { NoteService } from '@/lib/note-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure route segment for large file uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic'; // Ensure dynamic rendering
export const runtime = 'nodejs'; // Use Node.js runtime for file handling

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromAuth(req);

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check Content-Length header to detect oversized uploads early
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      const fileSizeBytes = parseInt(contentLength, 10);
      const maxFileSize = 25 * 1024 * 1024; // 25MB in bytes
      
      if (fileSizeBytes > maxFileSize) {
        return NextResponse.json({
          error: 'Your audio file is too large. The maximum file size allowed is 25MB.',
          details: `Your file size: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB. Please select a smaller audio file or compress it before uploading.`,
          maxSizeMB: 25,
          currentSizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2))
        }, { status: 413 });
      }
    }

    // Parse FormData with proper error handling
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error('FormData parsing error:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('boundary')) {
        return NextResponse.json({
          error: 'The audio file appears to be corrupted or incomplete. Please try uploading again.',
          details: 'If the problem persists, try clearing your browser cache or using a different browser.',
          code: 'FORM_DATA_CORRUPTED'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Failed to process your audio file. Please ensure the file is valid and try again.',
        details: 'Make sure your file is a valid audio file (MP3, WAV, FLAC, M4A, OGG, WebM, MP4, or AAC).',
        code: 'FORM_DATA_ERROR'
      }, { status: 400 });
    }

    const audioFile = formData.get('audio') as File;
    const fileName = formData.get('fileName') as string || 'recorded-audio';
    const folderId = formData.get('folderId') as string | null;

    // Validate that audioFile is actually a File object
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: 'No valid audio file provided' }, { status: 400 });
    }

    // Validate file has content
    if (audioFile.size === 0) {
      return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
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

    // Validate file type - check both MIME type and file extension
    const allowedMimeTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/flac', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/webm',
      'audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'
    ];

    // Get file extension as fallback for validation
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm', 'mp4', 'aac'];

    console.log('Received audio file with MIME type:', audioFile.type);
    console.log('File extension:', fileExtension);

    const isValidMimeType = allowedMimeTypes.includes(audioFile.type);
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json({
        error: `Unsupported audio format: ${audioFile.type} (.${fileExtension}). Supported formats: MP3, WAV, FLAC, M4A, OGG, WebM, MP4, AAC.`
      }, { status: 400 });
    }

    // Check note creation access (allows free tier: 1 note)
    const accessCheck = await FeatureGateService.checkNoteCreationAccess();
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.message,
          notesUsed: accessCheck.notesUsed,
          notesLimit: accessCheck.notesLimit,
          upgradeUrl: accessCheck.upgradeUrl || '/pricing',
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
      'audio/x-wav': 'wav',
      'audio/flac': 'flac',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/mp4': 'mp4',
      'audio/aac': 'aac',
    };

    // Get file extension from MIME type or filename
    let transcriptionExtension = mimeToExtension[audioFile.type.toLowerCase()];
    if (!transcriptionExtension) {
      // Fallback to extracting from filename
      const fileNameParts = audioFile.name.split('.');
      transcriptionExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    }

    console.log('Using file extension for transcription:', transcriptionExtension);

    // Create proper filename with extension for OpenAI to detect format
    const properFileName = audioFile.name.includes('.')
      ? audioFile.name
      : `audio.${transcriptionExtension}`;

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
      noteResult = await noteService.generateAINote(transcriptRecord.id, userId, folderId || undefined);
      console.log('Notes generation completed successfully');

      // Increment user's notes count after successful note creation
      await prisma.user.update({
        where: { id: userId },
        data: { notesCount: { increment: 1 } }
      });
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

    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('FormData')) {
        return NextResponse.json(
          { error: 'Invalid form data format. Please check your request.' },
          { status: 400 }
        );
      }
      if (error.message.includes('boundary')) {
        return NextResponse.json(
          { error: 'Malformed multipart data. Please try uploading again.' },
          { status: 400 }
        );
      }
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return NextResponse.json(
          { error: 'Transcription timeout. Please try with a shorter audio file.' },
          { status: 408 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio. Please try again.' },
      { status: 500 }
    );
  }
}
