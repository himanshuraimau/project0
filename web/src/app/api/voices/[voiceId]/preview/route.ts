import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function GET(
  request: NextRequest,
  { params }: { params: { voiceId: string } }
) {
  try {
    const { voiceId } = params;

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID is required' },
        { status: 400 }
      );
    }

    const apiKey = config.podcast.elevenlabs.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // First try to get voice details to check for preview URL
    const voiceResponse = await fetch(`${config.podcast.elevenlabs.baseUrl}/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!voiceResponse.ok) {
      throw new Error(`ElevenLabs API error: ${voiceResponse.status} ${voiceResponse.statusText}`);
    }

    const voiceData = await voiceResponse.json();

    // If voice has preview URL, fetch it
    if (voiceData.preview_url) {
      const previewResponse = await fetch(voiceData.preview_url);
      if (previewResponse.ok) {
        const arrayBuffer = await previewResponse.arrayBuffer();
        
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }
    }

    // Fallback: generate short preview using TTS
    const previewText = "Hello, this is a preview of my voice for your podcast.";
    
    const ttsResponse = await fetch(`${config.podcast.elevenlabs.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: previewText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      throw new Error(`ElevenLabs TTS error: ${ttsResponse.status} ${ttsResponse.statusText} - ${errorText}`);
    }

    const arrayBuffer = await ttsResponse.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Voice preview error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get voice preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}