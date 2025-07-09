import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('audio') as File;

  if (!file || file.size > 60000) {
    return NextResponse.json({ error: 'Invalid or too large file (max 60KB)' }, { status: 400 });
  }

  try {
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    const result = await elevenlabs.speechToText.convert({
      file: blob,
      modelId: 'scribe_v1',
      languageCode: 'eng',
      tagAudioEvents: true,
      diarize: true,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Transcription error:', err);
    return NextResponse.json({ error: 'Failed to transcribe' }, { status: 500 });
  }
}
