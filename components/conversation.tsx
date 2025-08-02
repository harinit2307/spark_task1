'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect } from 'react';

export function Conversation() {
  const conversation = useConversation();

  useEffect(() => {
    console.log('Conversation status:', conversation.status);
  }, [conversation.status]);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_AGENT_ID!,
        connectionType: 'websocket',
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs');
        },
        onDisconnect: () => {
          console.log('❌ Disconnected from ElevenLabs');
        },
        onMessage: (message) => {
          console.log('🧠 Message from agent:', message);
        },
        onError: (message: string, context?: any) => {
          console.error('🔥 Error from agent:', message, context);
        },
        onAudio: (audioData: string) => {
          try {
            let audioBlob: Blob;

            if (audioData.startsWith('data:')) {
              // If audio is in data URL format
              const matches = audioData.match(/^data:(audio\/[a-zA-Z0-9]+);base64,(.*)$/);
              if (!matches) throw new Error('Invalid data URL format');
              
              const mimeType = matches[1];
              const base64Data = matches[2];
              const byteCharacters = atob(base64Data);
              const byteArray = new Uint8Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
              }

              audioBlob = new Blob([byteArray], { type: mimeType });
            } else {
              // Assume raw base64 string and fallback to 'audio/mpeg'
              const byteCharacters = atob(audioData);
              const byteArray = new Uint8Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
              }

              audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.oncanplaythrough = () => {
              URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = (e) => {
              console.error('❌ Audio playback error', e);
              URL.revokeObjectURL(audioUrl);
            };

            audio.play().catch(error => {
              console.error('🎧 Error playing audio:', error);
              URL.revokeObjectURL(audioUrl);
            });
          } catch (error) {
            console.error('🎙️ Error processing audio:', error);
          }
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          🎙️ Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-300"
        >
          🛑 Stop
        </button>
      </div>

      <div className="text-sm text-gray-700">
        Status: <strong>{conversation.status}</strong><br />
        Agent is <strong>{conversation.isSpeaking ? 'speaking' : 'listening'}</strong>
      </div>
    </div>
  );
}
