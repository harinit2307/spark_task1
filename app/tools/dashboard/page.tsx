'use client';

import { useState } from 'react';

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to convert text to speech.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 py-6 px-8">
      {/* Header */}
      <header className="w-full mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-5 text-white text-center">
            <h1 className="text-4xl font-bold mb-1">Text To Speech</h1>
            <p className="text-gray-200 text-sm">Convert your text into speech instantly</p>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-inner p-6 w-full max-w-4xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-96 p-6 rounded-lg text-gray-800 text-xl resize-none bg-gray-50 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter text here..."
        />

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleSpeak}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg text-xl transition disabled:opacity-50"
          >
            {loading ? 'Speaking...' : '🔊 Speak'}
          </button>

          {audioUrl && (
            <a
              href={audioUrl}
              download="speech.mp3"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg text-xl transition"
            >
              ⬇️ Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
