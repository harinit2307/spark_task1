// app/api/speak/route.ts
import { NextResponse } from 'next/server';
import { getSpeechBuffer } from '@/lib/tts';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const audioBuffer = await getSpeechBuffer(text);
    const chunks: Buffer[] = [];
    for await (const chunk of audioBuffer) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (err) {
    console.error('TTS Error:', err);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}