import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      name: body.name, // ✅ Agent name
      voice: {
        voice_id: body.voice_id || 'EXAVITQu4vr4xnSDxMaL',
      },
      conversation_config: {
        agent: {
          first_message: body.first_message, // ✅ First message in UI
          prompt: {
            prompt: body.prompt, // ✅ System prompt in UI
            llm: {
              model: body.model || 'eleven-multilingual-v1',
              temperature: body.temperature ?? 0.7,
            },
          },
          language: body.language || 'en',
        },
        tts: {
          audio_format: {
            format: 'pcm',
            sample_rate: 16000,
          },
        },
      },
    };

    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', detail: String(error) },
      { status: 500 }
    );
  }
}
