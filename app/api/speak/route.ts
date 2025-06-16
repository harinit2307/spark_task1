// app/api/speak/route.ts
import { getSpeechBuffer } from '@/lib/tts';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const readableStream = await getSpeechBuffer(text);
    const readableStreamWeb = new ReadableStream({
      async start(controller) {
        for await (const chunk of readableStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    return new NextResponse(readableStreamWeb, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (err) {
    console.error('TTS Error:', err);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
