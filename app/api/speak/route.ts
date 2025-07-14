import { NextResponse } from 'next/server';
import { getSpeechBuffer } from '@/lib/tts';
import { translate } from '@vitalets/google-translate-api';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { text, to } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 });
  }

  try {
    const { text: translated } = await translate(text, { to: to || 'en' });

    const audioStream = await getSpeechBuffer(translated);
    const audioBuffer = await streamToBuffer(audioStream);

    const filename = `${randomUUID()}.mp3`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tts-audio')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('tts-audio').getPublicUrl(filename);

    const { error: insertError } = await supabase.from('tts_history').insert([
      {
        input_text: text,
        translated,
        lang: to,
        audio_path: publicUrl,
      },
    ]);

    if (insertError) {
      console.error('❌ DB insert error:', insertError.message);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }

    // ✅ Now return the audio as blob URL and metadata
    return NextResponse.json({
      success: true,
      audioUrl: publicUrl,
    });
  } catch (err: any) {
    console.error('❌ TTS error:', err.message || err);
    return NextResponse.json({ error: 'Speech generation failed' }, { status: 500 });
  }
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value!);
  }
  return Buffer.concat(chunks);
}
