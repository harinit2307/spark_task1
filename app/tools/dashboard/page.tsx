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
  { label: 'Korean', code: 'ko' },
  { label: 'Arabic', code: 'ar' },
  { label: 'Russian', code: 'ru' },
  { label: 'Portuguese', code: 'pt' },
  { label: 'Italian', code: 'it' },
  { label: 'Tamil', code: 'ta' },
];
const supabase = createClient();

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsHistory, setTtsHistory] = useState<any[]>([]);
  const [popupText, setPopupText] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAudioPath, setConfirmDeleteAudioPath] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 1;
  const totalPages = Math.ceil(totalCount / pageSize);

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
    setTimeout(() => fetchTtsHistory(), 500);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `speech-${lang}.mp3`;
    a.click();
  };

  const fetchTtsHistory = async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('tts_history')
      .select('id, input_text, translated, lang, audio_path', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Fetch error:', error.message);
    } else {
      setTtsHistory(data || []);
      setTotalCount(count || 0);
    }
  };

  const confirmDelete = (id: string, audioPath: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteAudioPath(audioPath);
  };

  const deleteNow = async () => {
    if (!confirmDeleteId || !confirmDeleteAudioPath) return;

    try {
      const filePath = decodeURIComponent(confirmDeleteAudioPath.split('/tts-audio/')[1] || '');

      const { error: dbError } = await supabase
        .from('tts_history')
        .delete()
        .eq('id', confirmDeleteId);

      if (!filePath) {
        alert('Invalid file path.');
        return;
      }

      const { error: storageError } = await supabase.storage
        .from('tts-audio')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion failed:', storageError.message);
        alert('Failed to delete audio file.');
        return;
      }

      if (dbError) {
        console.error('DB deletion failed:', dbError.message);
        alert('Failed to delete record.');
        return;
      }

      setConfirmDeleteId(null);
      setConfirmDeleteAudioPath(null);
      fetchTtsHistory();
    } catch (err: any) {
      console.error('Deletion error:', err.message || err);
      alert('Unexpected error deleting.');
    }
  };

  useEffect(() => {
    fetchTtsHistory();
  }, [page]);

  const getLangLabel = (code: string) => {
    const found = LANGS.find((l) => l.code === code);
    return found ? found.label : code;
  };

  const getPaginationNumbers = () => {
    const visiblePages = 5;
    let start = Math.max(1, page - Math.floor(visiblePages / 2));
    let end = Math.min(totalPages, start + visiblePages - 1);
    if (end - start < visiblePages - 1) start = Math.max(1, end - visiblePages + 1);

    const pages = [];
    if (start > 1) pages.push(1, '...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push('...', totalPages);
    return pages;
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
                ⬇ Download
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
                    <td className="border px-4 py-2">{(page - 1) * pageSize + index + 1}</td>
                    <td className="border px-4 py-2">{row.input_text}</td>
                    <td className="border px-4 py-2">{getLangLabel(row.lang)}</td>
                    <td className="border px-4 py-2 flex flex-wrap justify-center gap-2">
                      {row.audio_path && (
                        <button
                          onClick={() => new Audio(row.audio_path).play()}
                          className="text-blue-400 hover:underline"
                        >
                          ▶ Play
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
                        onClick={() => confirmDelete(row.id, row.audio_path)}
                        className="text-red-400 hover:underline"
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-4 gap-1 flex-wrap">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
            disabled={page === 1}
          >
            ⬅
          </button>
          {getPaginationNumbers().map((num, idx) => (
            <button
              key={idx}
              onClick={() => typeof num === 'number' && setPage(num)}
              className={`px-3 py-1 rounded ${
                page === num ? 'bg-white text-black' : 'bg-gray-800 text-white'
              } ${typeof num !== 'number' && 'cursor-default'}`}
              disabled={typeof num !== 'number'}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
            disabled={page === totalPages}
          >
            ➡
          </button>
        </div>
      </div>

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

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full text-white text-center">
            <h3 className="text-lg font-semibold mb-4">Delete Confirmation</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this TTS record?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={deleteNow}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmDeleteAudioPath(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}