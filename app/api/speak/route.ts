import { NextResponse } from 'next/server';
import { getSpeechBuffer } from '@/lib/tts';
import { translate } from '@vitalets/google-translate-api';
import { createClient } from '@/lib/supabase/server'; // ✅ Use the server version

export async function POST(req: Request) {
  const supabase = await createClient(); // ✅ Await this inside the handler

  const { text, to } = await req.json();
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

  try {
    const { text: translated } = await translate(text, { to: to || 'en' });
    const audioBuffer = await getSpeechBuffer(translated);
    const buffer = await streamToBuffer(audioBuffer);

    // ✅ Store in Supabase
    const { error } = await supabase.from('tts_history').insert([
      {
        input_text: text,
        translated,
        lang: to,
      },
    ]);

    if (error) console.error('❌ Supabase insert failed:', error.message);

    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (err) {
    console.error('❌ Error:', err);
    return NextResponse.json({ error: 'Speech generation failed' }, { status: 500 });
  }
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
