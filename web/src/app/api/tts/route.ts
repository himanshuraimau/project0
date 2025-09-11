import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, settings = {} } = body;

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
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

    // Default voice settings
    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
      ...settings
    };

    const response = await fetch(
      `${config.podcast.elevenlabs.baseUrl}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice_settings: voiceSettings
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Text-to-speech generation failed',
          message: `ElevenLabs API error: ${response.status}`
        },
        { status: response.status }
      );
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('TTS API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
