// lib/stt.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function transcribeAudio(file: Blob) {
  return await elevenlabs.speechToText.convert({
    file,
    modelId: 'scribe_v1',
    tagAudioEvents: true,
    languageCode: 'eng', // or null to auto-detect
    diarize: true,
  });
}
