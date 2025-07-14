// text-to-speech.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { voiceId, text } = await req.json();

  if (!voiceId || !text) {
    return NextResponse.json({ error: 'Missing voiceId or text' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }),
  });

  if (!res.ok) {
    const errData = await res.json();
    return NextResponse.json({ error: 'TTS failed', details: errData }, { status: 500 });
  }

  const audio = await res.arrayBuffer();

  return new NextResponse(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="cloned-voice.mp3"',
    },
  });
}
