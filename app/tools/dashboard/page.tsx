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
  // Add more languages as needed
];

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSpeak = async () => {
    if (!text) return alert('Enter text');
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, to: lang }),
    });
    if (!res.ok) return alert('TTS failed');
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
    <div className="bg-black text-white min-h-screen p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6">Text to Speech</h1>
      <textarea
        className="w-full max-w-2xl h-48 bg-gray-800 p-4 mb-4"
        placeholder="Type here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex space-x-4 mb-4">
        <select
          className="bg-gray-800 px-4 py-2"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleSpeak}
          className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          🔊 Generate Speech
        </button>
        {audioUrl && (
          <button
            onClick={handleDownload}
            className="bg-green-600 px-6 py-2 rounded hover:bg-green-700 transition"
          >
            ⬇️ Download
          </button>
        )}
      </div>
      {audioUrl && (
        <audio controls src={audioUrl} className="mt-4 w-full max-w-2xl" />
      )}
    </div>
  );
}
