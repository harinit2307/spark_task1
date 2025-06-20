'use client';

import { useState } from 'react';

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl(null); // Clear any previous download

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
      <header className="w-full mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 text-white text-center">
            <h1 className="text-3xl font-bold mb-1">Text To Speech</h1>
            <p className="text-gray-200 text-sm">Convert your text into speech instantly</p>
          </div>
        </div>
      </header>
      <div className="bg-gray-100 rounded-lg shadow-lg p-4 w-full max-w-4xl mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-96 p-6 rounded-md text-white text-xl resize-none bg-gray-900"
          placeholder="Enter text here..."
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleSpeak}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded shadow text-xl disabled:opacity-50"
          >
            {loading ? 'Speaking...' : '🔊 Speak'}
          </button>

          {audioUrl && (
            <a
              href={audioUrl}
              download="speech.mp3"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded shadow text-xl"
            >
              ⬇️ Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
