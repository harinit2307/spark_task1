'use client';
import { useState } from 'react';

const LANGS = [
  { label: 'English', code: 'en' },
  { label: 'Hindi', code: 'hi' },
  { label: 'German', code: 'de' },
  { label: 'Spanish', code: 'es' },
  { label: 'French', code: 'fr' },
  { label: 'Chinese (Simplified)', code: 'zh-CN' },
  { label: 'Japanese', code: 'ja' },
];

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return alert('Enter text');

    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, to: lang }),
    });

    if (!res.ok) {
      alert('TTS failed');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    new Audio(url).play();
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `speech-${lang}.mp3`;
    a.click();
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-purple via-black to-blue-900 text-white">
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Text to Speech
        </h1>
        <p className="text-gray-400 mt-2">
          Generate speech from your text using ElevenLabs-style UI
        </p>
      </div>

      <div className="w-full max-w-2xl bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
        <textarea
          className="w-full h-40 p-4 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
          placeholder="Type your message here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex flex-wrap gap-4 justify-between items-center">
          <select
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <div className="flex gap-4">
            <button
              onClick={handleSpeak}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
            >
              🔊 Generate Speech
            </button>

            {audioUrl && (
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
              >
                ⬇️ Download
              </button>
            )}
          </div>
        </div>

        {audioUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-center text-white">Generated Audio</h3>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
