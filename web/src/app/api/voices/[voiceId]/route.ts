import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  try {
    const { voiceId } = await params;

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

    const response = await fetch(`${config.podcast.elevenlabs.baseUrl}/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const voiceData = await response.json();
    const mappedVoice = mapElevenLabsVoiceToVoice(voiceData);

    return NextResponse.json({
      success: true,
      voice: mappedVoice
    });

  } catch (error) {
    console.error('Voice details API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch voice details',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function mapElevenLabsVoiceToVoice(apiVoice: any) {
  // Extract metadata from labels or description
  const labels = apiVoice.labels || {};
  const description = apiVoice.description || '';

  // Determine gender from labels or name
  let gender: 'male' | 'female' = 'male';
  if (labels.gender) {
    gender = labels.gender.toLowerCase() === 'female' ? 'female' : 'male';
  } else if (description.toLowerCase().includes('female') || description.toLowerCase().includes('woman')) {
    gender = 'female';
  }

  // Determine age from labels or description
  let age: 'young' | 'middle_aged' | 'old' = 'middle_aged';
  if (labels.age) {
    const ageLabel = labels.age.toLowerCase();
    if (ageLabel.includes('young') || ageLabel.includes('teen')) {
      age = 'young';
    } else if (ageLabel.includes('old') || ageLabel.includes('senior')) {
      age = 'old';
    }
  }

  // Determine accent from labels
  const accent = labels.accent || labels.language || 'neutral';

  return {
    id: apiVoice.voice_id,
    name: apiVoice.name,
    gender,
    age,
    accent,
    description: description || `${gender} voice with ${accent} accent`,
    previewUrl: apiVoice.preview_url
  };
}