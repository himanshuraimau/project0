import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function GET(request: NextRequest) {
  try {
    const apiKey = config.podcast.elevenlabs.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${config.podcast.elevenlabs.baseUrl}/user`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    
    const usage = {
      charactersUsed: userData.subscription?.character_count || 0,
      charactersLimit: userData.subscription?.character_limit || 0
    };

    return NextResponse.json({
      success: true,
      usage
    });

  } catch (error) {
    console.error('Usage API error:', error);
    
    // Don't fail completely for usage info - return defaults
    return NextResponse.json({
      success: true,
      usage: { charactersUsed: 0, charactersLimit: 0 }
    });
  }
}