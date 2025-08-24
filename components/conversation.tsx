'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';
import { Bot, X } from 'lucide-react';

type ConversationProps = {
  agentId: string;
  agentName: string;
  onClose?: () => void; // 👈 NEW: parent close handler
};

export function Conversation({ agentId, agentName, onClose }: ConversationProps) {
  const conversation = useConversation();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isMuted, setIsMuted] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState({ code: 'us', label: 'English' });

  const languages = [
    { code: 'us', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'in', label: 'Hindi' },
  ];

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (conversation.status === 'connected' && startTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        setElapsedTime(`${mins}:${secs}`);
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [conversation.status, startTime]);

  const startConversation = useCallback(async () => {
    try {
      if (!agentId) return;
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
    } catch (err) {
      console.error('Error ending conversation:', err);
    } finally {
      setStartTime(null);
      setElapsedTime('00:00');
    }
  }, [conversation]);

  // 👇 NEW: close handler used by the cross button
  const handleClose = useCallback(async () => {
    try {
      if (conversation.status === 'connected') {
        await conversation.endSession();
      }
    } catch (e) {
      console.error('Error on close:', e);
    } finally {
      setStartTime(null);
      setElapsedTime('00:00');
      onClose?.(); // tell parent to hide the modal
    }
  }, [conversation, onClose]);

  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen text-white relative"
      style={{ backgroundColor: '#0f0f0f' }} // solid dark like knowledge base
    >
      {/* Top-right Cross Button (now closes the modal) */}
      <button
        type="button"
        aria-label="Close"
        onClick={handleClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center
                   bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105 transition"
      >
        <X className="text-white w-5 h-5" />
      </button>

      {/* Title */}
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Smart Voice Assistant
      </h1>

      {/* Two-line subheading */}
      <p className="text-gray-300 mb-10 text-center max-w-xl">
        It naturally and clearly helps you get things done easily.
        <br />
        It understands you and responds with a friendly tone.
      </p>

      {/* Timer */}
      <div className="text-3xl text-gray-300 font-semibold mb-6">{elapsedTime}</div>

      {/* Animated Circle */}
      <style>{`
        .outer-circle {
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #a855f7, #7e22ce);
          display: flex; align-items: center; justify-content: center;
          animation: pulse-glow 2s ease-in-out infinite;
          box-shadow: 0 0 25px rgba(168,85,247,0.8);
        }
        .inner-blob {
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.25), transparent 70%);
          width: 85%; height: 85%;
        }
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 0 25px rgba(168,85,247,0.8); }
          50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(168,85,247,1); }
          100% { transform: scale(1); box-shadow: 0 0 25px rgba(168,85,247,0.8); }
        }
      `}</style>

      <div className="mb-6">
        <div className="outer-circle w-[200px] h-[200px]">
          <div className="inner-blob" />
        </div>
      </div>

      {/* Agent Info */}
      <div className="flex items-center gap-3 text-center mt-4">
      <p className="text-[40px] font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
  {agentName}
</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 p-4 bg-[#1f1f1f] rounded-full shadow-lg mt-8">
        {/* Language Selector */}
        <div className="relative">
          <button
            type="button"
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
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangDropdown(false);
                  }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800 w-full text-left transition"
                >
                  <img src={`https://flagcdn.com/${lang.code}.svg`} alt={lang.label} className="w-6 h-6 rounded-full" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mic Button */}
        <button
          type="button"
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
          type="button"
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-md shadow-black/40 transition disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.3 15.46l-4.6-.92a1 1 0 00-1.04.42l-1.07 1.61a11.94 11.94 0 01-5.18 0l-1.07-1.61a1 1 0 00-1.04-.42l-4.6.92a1 1 0 00-.78 1.09A16.93 16.93 0 0012 19c3.18 0 6.16-.9 8.38-2.45a1 1 0 00-.78-1.09z" />
          </svg>
        </button>
      </div>
    </div>
  );
}