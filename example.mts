import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs/promises';
import path from 'path';

// Get API key from command line argument
const apiKey = process.argv[2];
if (!apiKey) {
  throw new Error('Please provide the API key as a command line argument: npx tsx example.mts your-api-key');
}

// Initialize ElevenLabsClient with API key
const elevenlabs = new ElevenLabsClient({ apiKey });

async function main() {
  try {
    const audio = await elevenlabs.textToSpeech.convert('EXAVITQu4vr4xnSDxMaL', {
      text: 'The first move is what sets everything in motion.',
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Save audio to a file
    const outputFilePath = path.join(process.cwd(), 'output.mp3');
    await fs.writeFile(outputFilePath, audio);
    console.log(`Audio saved successfully to ${outputFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();