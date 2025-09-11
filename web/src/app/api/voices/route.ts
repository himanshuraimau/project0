import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/environment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';

    const apiKey = config.podcast.elevenlabs.apiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${config.podcast.elevenlabs.baseUrl}/voices`, {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter and map voices for the requested language
    const filteredVoices = filterVoicesByLanguage(data.voices || [], language);

    return NextResponse.json({
      success: true,
      voices: filteredVoices
    });

  } catch (error) {
    console.error('Voices API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch voices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function filterVoicesByLanguage(voices: any[], language: string) {
  const languageMap: Record<string, string[]> = {
    'en': ['en', 'english'],
    'es': ['es', 'spanish', 'español'],
    'fr': ['fr', 'french', 'français'],
    'de': ['de', 'german', 'deutsch']
  };

  const targetLanguages = languageMap[language] || [language];

  return voices
    .filter(voice => {
      // Filter by language if specified in voice metadata
      if (voice.labels && voice.labels.language) {
        const voiceLang = voice.labels.language.toLowerCase();
        return targetLanguages.some(lang => voiceLang.includes(lang));
      }
      // If no language metadata, include all voices for now
      return true;
    })
    .map(voice => mapElevenLabsVoiceToVoice(voice))
    .filter(voice => voice.id && voice.name); // Ensure valid voice data
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