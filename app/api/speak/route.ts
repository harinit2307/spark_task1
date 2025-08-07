// /app/api/speak/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { translate } from '@vitalets/google-translate-api/dist/cjs/index.js'; // or your preferred API

export async function POST(req: NextRequest) {
  const { text, to } = await req.json();

  if (!text || !to) {
    return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
  }

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
  const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID!;

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    return NextResponse.json({ error: 'API key or voice ID not configured' }, { status: 500 });
  }

  try {
    // Step 1: Translate text to target language
    const translation = await translate(text, { to: to || 'en' });
    const translatedText = translation.text;

    // Step 2: Call ElevenLabs TTS
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: translatedText,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75
        }
      })
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      return NextResponse.json({ error: 'TTS failed', details: errorData }, { status: 500 });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    return new Response(Buffer.from(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: any) {
    console.error('TTS Translation Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
