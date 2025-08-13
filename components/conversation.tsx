'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';

type ConversationProps = {
  agentId: string;
  agentName: string; // new
};

export function Conversation({ agentId, agentName }: ConversationProps) {
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

  // Timer updater
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
      if (!agentId) {
        console.error('Missing agentId');
        return;
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId,
        connectionType: 'websocket',
        onConnect: () => setStartTime(Date.now()),
        onDisconnect: () => {
          setStartTime(null);
          setElapsedTime('00:00');
        },
        onAudio: (audioData) => {
          const audio = new Audio(audioData);
          if (!isMuted) audio.play();
        },
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  }, [conversation, isMuted, agentId]);

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
    <div
      className="flex flex-col justify-center items-center min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, rgba(17,17,17,1) 0%, rgba(45,6,77,1) 40%, rgba(8,0,255,0.3) 100%)',
      }}
    >
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Conversational Interface
      </h1>
      <p className="text-gray-300 mb-10 text-center max-w-xl">
        Real-time AI chatbot for natural and interactive conversations.
      </p>

      {/* Timer */}
      <div className="text-3xl text-gray-300 font-semibold mb-6">{elapsedTime}</div>

      {/* Animated Circle */}
      <style>{`
        .outer-circle {
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #a855f7, #7e22ce);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse-glow 2s ease-in-out infinite;
          box-shadow: 0 0 25px rgba(168, 85, 247, 0.8);
        }
        .inner-blob {
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.25), transparent 70%);
          width: 85%;
          height: 85%;
        }
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 25px rgba(168, 85, 247, 0.8); }
          50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(168, 85, 247, 1); }
          100% { transform: scale(1); box-shadow: 0 0 25px rgba(168, 85, 247, 0.8); }
        }
      `}</style>

      <div className="mb-6">
        <div className="outer-circle w-[200px] h-[200px]">
          <div className="inner-blob"></div>
        </div>
      </div>

      {/* Agent Info */}
      <div className="text-center mt-4">
        <p className="text-xl font-semibold">{agentName}</p>
        <p className="text-sm text-gray-400">ID: {agentId}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 p-4 bg-[#1f1f1f] rounded-full shadow-lg mt-8">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown((prev) => !prev)}
            className="w-14 h-14 rounded-full border border-gray-500 overflow-hidden focus:outline-none hover:scale-105 transition shadow-md shadow-black/40"
          >
            <img
              src={`https://flagcdn.com/${selectedLang.code}.svg`}
              alt={selectedLang.label}
              className="w-full h-full object-cover"
            />
          </button>

          {showLangDropdown && (
            <div className="absolute top-16 left-0 bg-black text-white shadow-lg rounded-lg overflow-hidden z-10 text-lg border border-gray-700 min-w-[160px]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangDropdown(false);
                  }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800 w-full text-left transition"
                >
                  <img
                    src={`https://flagcdn.com/${lang.code}.svg`}
                    alt={lang.label}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Mic Button */}
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 shadow-md shadow-black/40 transition disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
            <path d="M19 11a7 7 0 01-14 0H3a9 9 0 0018 0h-2z" />
          </svg>
        </button>

        {/* End Call Button */}
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-md shadow-black/40 transition disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.3 15.46l-4.6-.92a1 1 0 00-1.04.42l-1.07 1.61a11.94 11.94 0 01-5.18 0l-1.07-1.61a1 1 0 00-1.04-.42l-4.6.92a1 1 0 00-.78 1.09A16.93 16.93 0 0012 19c3.18 0 6.16-.9 8.38-2.45a1 1 0 00-.78-1.09z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
