import { NextResponse } from 'next/server';
import { getSpeechBuffer } from '@/lib/tts';
import { translate } from '@vitalets/google-translate-api';

export async function POST(req: Request) {
  const { text, to } = await req.json();
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

  // 1. Translate first
  const { text: translated } = await translate(text, { to: to || 'en' });

  // 2. Generate speech on the translated text
  const audioBuffer = await getSpeechBuffer(translated);
  const buffer = await streamToBuffer(audioBuffer);

  return new Response(buffer, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
