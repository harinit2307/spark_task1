import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const voiceIdFromClient = formData.get('voiceId') as string | null;
    const textToSpeak = (formData.get('text') as string) || 'Hello, this is a test of voice cloning technology.';

    // Validate audio file
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ 
        error: 'No valid audio file provided',
        details: { type: typeof audioFile, value: audioFile }
      }, { status: 400 });
    }

    // Validate file size
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size too large',
        details: { size: audioFile.size, maxSize: 10 * 1024 * 1024 }
      }, { status: 400 });
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: { type: audioFile.type }
      }, { status: 400 });
    }

    // Convert file to proper format
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    let finalVoiceId = voiceIdFromClient;

    // Only create new voice if voiceId is not provided
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
          errorData: errorData
        });

        // Check for subscription-related errors
        if (errorData?.detail?.status === 'can_not_use_instant_voice_cloning') {
          return NextResponse.json({
            error: 'Your subscription does not support instant voice cloning. Please upgrade your ElevenLabs subscription.',
            details: errorData,
            subscription_required: true
          }, { status: 403 });
        }

        // Handle other errors
        const errorMessage = errorData?.detail?.message || 
                            errorData?.detail?.status || 
                            errorData?.message || 
                            errorData?.error || 
                            `HTTP ${voiceCreationResponse.status}: ${voiceCreationResponse.statusText}`;
        
        return NextResponse.json({ 
          error: `Failed to create voice from audio: ${errorMessage}`,
          details: errorData
        }, { status: 500 });
      }

      const voiceData = await voiceCreationResponse.json();
      finalVoiceId = voiceData.voice_id;
    }

    // Use finalVoiceId (either provided or newly created)
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
      console.error('TTS error:', errorData);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }

    const audioArrayBuffer = await ttsResponse.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="cloned-voice.mp3"',
      },
    });
  } catch (error) {
    console.error('Voice cloning error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
