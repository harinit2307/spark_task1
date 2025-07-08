// example.mts

// Load environment variables from .env
import "dotenv/config";

import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";

// Optional: log to verify API key is loaded correctly
console.log("API Key loaded:", process.env.ELEVENLABS_API_KEY);

// Initialize ElevenLabs client with API key from environment
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

const voiceId = "JBFqnCBsd6RMkjVDRZzb";

// Fetch original audio file
const response = await fetch(
  "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3"
);

// Convert to blob
const audioBlob = new Blob([await response.arrayBuffer()], { type: "audio/mp3" });

// Convert original voice to the target voice
const audioStream = await elevenlabs.speechToSpeech.convert(voiceId, {
  audio: audioBlob,
  modelId: "eleven_multilingual_sts_v2",
  outputFormat: "mp3_44100_128",
});

// Play the transformed audio
await play(audioStream);
