'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';

export function Conversation() {
  const conversation = useConversation();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isMuted, setIsMuted] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState({
    code: 'us',
    label: 'English',
  });

  const languages = [
    { code: 'us', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'in', label: 'Hindi' },
  ];

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

      {/* Blue rotating disc like ElevenLabs */}
<div className="outer-circle">
  <div className="inner-blob"></div>
</div>




        {/* Assistant title */}
        <div className="text-xl font-bold text-black">Agent</div>
        <p className="text-sm text-gray-500 mb-2">Your College assistant</p>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-2 relative">
          {/* Flag with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown((prev) => !prev)}
              className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden focus:outline-none"
            >
              <img
                src={`https://flagcdn.com/${selectedLang.code}.svg`}
                alt={selectedLang.label}
                className="w-full h-full"
              />
            </button>

            {showLangDropdown && (
              <div className="absolute top-10 left-0 bg-white text-black shadow-md rounded-lg overflow-hidden z-10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangDropdown(false);
                    }}
                    className="flex items-center gap-1 px-5 py-2 hover:bg-gray-100 w-full text-left"
                  >
                    <img
                      src={`https://flagcdn.com/${lang.code}.svg`}
                      alt={lang.label}
                      className="w-5 h-5 rounded-full"
                    />
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mic button */}
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition"
          >
            <span className="text-black text-lg">🎙️</span>
          </button>

          {/* Professional End call button */}
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-md hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
