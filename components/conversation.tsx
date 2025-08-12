'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';
import { FaPhoneSlash } from 'react-icons/fa';

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
      const agentId = process.env.NEXT_PUBLIC_AGENT_ID!;
      if (!agentId) {
        console.error('Missing NEXT_PUBLIC_AGENT_ID');
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
    <div className="flex flex-col justify-center items-center h-full bg-[#0b0b0f] text-white rounded-lg p-6">
      {/* Timer */}
      <div className="text-3xl text-gray-300 font-semibold mb-6">{elapsedTime}</div>

      {/* Bigger animated circle */}
      <div className="mb-6">
        <div className="outer-circle w-[200px] h-[200px]">
          <div className="inner-blob w-[170px] h-[170px]"></div>
        </div>
      </div>

      {/* Assistant Info */}
      <div className="text-center mb-10">
        <div className="text-3xl font-bold">Agent</div>
        <p className="text-lg text-gray-500">Your College assistant</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-10">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown((prev) => !prev)}
            className="w-14 h-14 rounded-full border-2 border-gray-500 overflow-hidden focus:outline-none"
          >
            <img
              src={`https://flagcdn.com/${selectedLang.code}.svg`}
              alt={selectedLang.label}
              className="w-full h-full"
            />
          </button>

          {showLangDropdown && (
            <div className="absolute top-16 left-0 bg-white text-black shadow-md rounded-lg overflow-hidden z-10 text-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangDropdown(false);
                  }}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-100 w-full text-left"
                >
                  <img
                    src={`https://flagcdn.com/${lang.code}.svg`}
                    alt={lang.label}
                    className="w-6 h-6 rounded-full"
                  />
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mic Button */}
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-2xl transition disabled:opacity-50"
        >
          🎙
        </button>

        {/* End Call Button */}
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-lg disabled:opacity-50 transition"
        >
          <FaPhoneSlash className="text-white text-3xl" />
        </button>
      </div>
    </div>
  );
}
