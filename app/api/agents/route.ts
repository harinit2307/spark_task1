// File: app/api/agent/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_config: {
          name: body.name || 'My AI Agent',
          prompt: {
            prompt: body.prompt || 'You are a helpful assistant.',
            llm: {
              model: body.model || 'eleven-multilingual-v1',
              temperature: body.temperature || 0.7,
            },
          },
          agent: {
            first_message: body.first_message || 'Hello! How can I assist you?',
            language: body.language || 'en',
          },
          tts: {
            voice_id: body.voice_id || 'EXAVITQu4vr4xnSDxMaL', // Replace with your ElevenLabs voice_id
            audio_format: {
              format: 'pcm',
              sample_rate: 16000,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', detail: error }, { status: 500 });
  }
}
