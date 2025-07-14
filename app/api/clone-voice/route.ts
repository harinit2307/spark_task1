import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const voiceIdFromClient = formData.get('voiceId') as string | null;
    const textToSpeak = (formData.get('text') as string) || 'Hello, this is a test of voice cloning technology.';

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ 
        error: 'No valid audio file provided',
        details: { type: typeof audioFile, value: audioFile }
      }, { status: 400 });
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size too large',
        details: { size: audioFile.size, maxSize: 10 * 1024 * 1024 }
      }, { status: 400 });
    }

    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: { type: audioFile.type }
      }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    let finalVoiceId = voiceIdFromClient;

    // Attempt to create a new voice if not provided
    if (!finalVoiceId) {
      const voiceCreationFormData = new FormData();
      voiceCreationFormData.append(
        'files',
        new Blob([audioBuffer], { type: audioFile.type }),
        audioFile.name
      );
      voiceCreationFormData.append('name', `Voice_${Date.now()}`);
      voiceCreationFormData.append('description', 'Voice cloned from uploaded audio');

      const voiceCreationResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: voiceCreationFormData,
      });

      if (!voiceCreationResponse.ok) {
        const errorData = await voiceCreationResponse.json();
        console.error('Voice creation error:', {
          status: voiceCreationResponse.status,
          statusText: voiceCreationResponse.statusText,
          errorData
        });

        // Fallback to Rachel voice if cloning not allowed (free tier)
        if (
          errorData?.detail?.status === 'can_not_use_instant_voice_cloning' ||
          errorData?.error?.includes('cloning not allowed')
        ) {
          finalVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - built-in ElevenLabs voice
        } else {
          return NextResponse.json({
            error: 'Voice creation failed',
            details: errorData
          }, { status: voiceCreationResponse.status });
        }
      } else {
        const voiceData = await voiceCreationResponse.json();
        finalVoiceId = voiceData.voice_id;
      }
    }

    // Now synthesize speech using the final voice ID
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.json();
      console.error('TTS generation error:', errorData);
      return NextResponse.json({ error: 'Failed to generate speech', details: errorData }, { status: 500 });
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="cloned-voice.mp3"',
      },
    });

  } catch (error) {
    console.error('Voice cloning server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
