// components/TTSButton.tsx
'use client';

import { useState } from 'react';

export default function TTSButton() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl(null);

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error('TTS failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error(error);
      alert('Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg shadow-md p-4 border-2 border-gray-300">
          <textarea
            className="w-full h-48 p-4 text-black bg-gray-100 border-none outline-none resize-none placeholder-gray-500"
            placeholder="Enter text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSpeak}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Speaking...' : '🔊 Speak'}
        </button>

        {audioUrl && (
          <a
            href={audioUrl}
            download="tts_audio.mp3"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ⬇️ Download
          </a>
        )}
      </div>
    </div>
  );
}
