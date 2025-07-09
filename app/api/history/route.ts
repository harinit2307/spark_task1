import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
const supabase = createClient();

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, text } = await req.json();

    if (!audioBase64 || !text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('transcription_history')
      .insert([{ audio_base64: audioBase64, text }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
