'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const LANGS = [
  { label: 'English', code: 'en' },
  { label: 'Hindi', code: 'hi' },
  { label: 'German', code: 'de' },
  { label: 'Spanish', code: 'es' },
  { label: 'French', code: 'fr' },
  { label: 'Chinese (Simplified)', code: 'zh-CN' },
  { label: 'Japanese', code: 'ja' },
];

const supabase = createClient();

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsHistory, setTtsHistory] = useState<any[]>([]);
  const [popupText, setPopupText] = useState<string | null>(null);

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
    fetchTtsHistory();
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `speech-${lang}.mp3`;
    a.click();
  };

  const fetchTtsHistory = async () => {
    const { data, error } = await supabase
      .from('tts_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error.message);
    } else {
      setTtsHistory(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      console.warn('Delete skipped: Invalid ID');
      return;
    }

    const { error } = await supabase.from('tts_history').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error.message);
      alert('Failed to delete the record.');
    } else {
      fetchTtsHistory();
    }
  };

  useEffect(() => {
    fetchTtsHistory();
  }, []);

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

      {/* INPUT SECTION */}
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

      {/* HISTORY SECTION */}
      <div className="w-full max-w-4xl mt-10 bg-[#111] p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-center">TTS History</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800">
                <th className="border px-4 py-2">#</th>
                <th className="border px-4 py-2">Input Text</th>
                <th className="border px-4 py-2">Language</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {ttsHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-4">
                    No TTS history found.
                  </td>
                </tr>
              ) : (
                ttsHistory.map((row, index) => (
                  <tr key={row.id || index} className="bg-gray-900">
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2">{row.input_text}</td>
                    <td className="border px-4 py-2">{row.lang}</td>
                    <td className="border px-4 py-2 flex flex-wrap justify-center gap-2">
                      {row.audio_path && (
                        <button
                          onClick={() => {
                            const audio = new Audio(row.audio_path);
                            audio.play();
                          }}
                          className="text-blue-400 hover:underline"
                        >
                          ▶️ Play
                        </button>
                      )}
                      {row.translated && (
                        <button
                          onClick={() => setPopupText(row.translated)}
                          className="text-yellow-400 hover:underline"
                        >
                          💬 Translated
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-400 hover:underline"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP for TRANSLATED TEXT */}
      {popupText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-600 text-white p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Translated Text</h3>
            <p className="mb-4 max-h-60 overflow-y-auto">{popupText}</p>
            <button
              onClick={() => setPopupText(null)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
