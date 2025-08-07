'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';

export function Conversation() {
  const conversation = useConversation();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isMuted, setIsMuted] = useState(false);

  // Update timer every second
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (conversation.status === 'connected' && startTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        setElapsedTime(`${mins}:${secs}`);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [conversation.status, startTime]);

  const startConversation = useCallback(async () => {
    try {
      const agentId = process.env.NEXT_PUBLIC_AGENT_ID!;
      if (!agentId) {
        console.error('Missing NEXT_PUBLIC_AGENT_ID');
        return;
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });

      await conversation.startSession({
        agentId,
        connectionType: 'websocket',
        onConnect: () => {
          setStartTime(Date.now());
        },
        onDisconnect: () => {
          setStartTime(null);
          setElapsedTime('00:00');
        },
        onMessage: (msg) => console.log('Message:', msg),
        onError: (msg, ctx) => console.error('Error:', msg, ctx),
        onAudio: (audioData) => {
          const audio = new Audio(audioData);
          if (!isMuted) audio.play();
        },
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  }, [conversation, isMuted]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setStartTime(null);
      setElapsedTime('00:00');
    } catch (err) {
      console.error('Error ending conversation:', err);
    }
  }, [conversation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-[320px] relative p-6 bg-white rounded-2xl shadow-lg flex flex-col items-center text-center border border-gray-200">
        {/* Timer */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-medium">
          {elapsedTime}
        </div>

        {/* Blue spinner */}
        <div className="w-24 h-24 mb-2 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-spin-slow flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-300 to-blue-500 blur-sm"></div>
        </div>

        {/* Assistant title */}
        <div className="text-xl font-bold text-black">Eleven</div>
        <p className="text-sm text-gray-500 mb-2">Your ElevenLabs assistant</p>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-2">
          {/* Flag icon */}
          <img
            src="https://flagcdn.com/us.svg"
            alt="EN"
            className="w-6 h-6 rounded-full border border-gray-300"
          />

          {/* Mic button */}
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition"
          >
            <span className="text-black text-lg">🎙️</span>
          </button>

          {/* End call button */}
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 transition"
          >
            <span className="text-white text-lg">📴</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-4">
          Discover the capabilities of Conversational Agents powered by ElevenLabs
        </p>
      </div>
    </div>
  );
}
