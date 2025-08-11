// lib/elevenlabs.ts

export async function createAgentWithElevenLabs(name: string) {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  
    if (!ELEVENLABS_API_KEY) {
      throw new Error("Missing ElevenLabs API Key");
    }
  
    const response = await fetch('https://api.elevenlabs.io/v1/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        name,
        description: `Agent named ${name}`,
        model_id: 'eleven_multilingual_v2', // use a valid model ID
      }),
    });
  
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create agent: ${errText}`);
    }
  
    return await response.json();
  }
  