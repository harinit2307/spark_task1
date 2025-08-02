'use client';

import React from 'react';
import { useConversation } from '@elevenlabs/react';

export default function VoiceAgent() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onMessage: (msg) => console.log('Message:', msg),
    onError: (err) => console.error('Error:', err),
  });

  const startConversation = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true }); // request mic access
    await conversation.startSession({
      agentId: 'agent_01k0bayry3ex39dpsbm28vb97f', // Replace with your ElevenLabs Agent ID
      connectionType: 'websocket'    
    });
  };

  const stopConversation = async () => {
    await conversation.endSession();
  };

  return (
    <div className="p-4 rounded-lg shadow bg-white text-black">
      <h2 className="text-xl font-bold mb-2">Talk to My AI Agent</h2>
      <button onClick={startConversation} className="bg-blue-500 text-white px-4 py-2 mr-2 rounded">
        🎙️ Start Talking
      </button>
      <button onClick={stopConversation} className="bg-red-500 text-white px-4 py-2 rounded">
        🛑 Stop
      </button>
      <p className="mt-4">Status: {conversation.status}</p>
    </div>
  );
}
