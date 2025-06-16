'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';

export default function TTSButton() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-xl">
      <h2 className="text-lg font-semibold text-white">Text to Speech</h2>
      <textarea
        placeholder="Enter text to speak..."
        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 resize-none"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={handleSpeak}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
      >
        <Volume2 size={20} />
        {loading ? 'Speaking...' : 'Speak'}
      </button>
    </div>
  );
}
