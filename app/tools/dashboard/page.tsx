'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsHistory, setTtsHistory] = useState<any[]>([]);
  const [popupText, setPopupText] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAudioPath, setConfirmDeleteAudioPath] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 1;
  const totalPages = Math.ceil(totalCount / pageSize);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

    const { data, count } = await supabase
      .from('tts_history')
      .select('id, input_text, translated, lang, audio_path', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    setTtsHistory(data || []);
    setTotalCount(count || 0);
  };

  const confirmDelete = (id: string, audioPath: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteAudioPath(audioPath);
  };

  const deleteNow = async () => {
    if (!confirmDeleteId || !confirmDeleteAudioPath) return;
    try {
      const filePath = decodeURIComponent(confirmDeleteAudioPath.split('/tts-audio/')[1] || '');
      await supabase.from('tts_history').delete().eq('id', confirmDeleteId);
      if (filePath) {
        await supabase.storage.from('tts-audio').remove([filePath]);
      }
      setConfirmDeleteId(null);
      setConfirmDeleteAudioPath(null);
      fetchTtsHistory();
    } catch (err) {
      console.error(err);
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#111] text-white">
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Text to Speech
        </h1>
        <p className="text-gray-400 mt-2">Generate speech from your text using ElevenLabs-style UI</p>
      </div>

      <div className="w-full max-w-2xl bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
        <textarea
          className="w-full h-40 p-4 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
          placeholder="Type your message here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex flex-wrap gap-4 justify-between items-center">
          {/* Custom Gradient Dropdown */}
          <div className="relative w-48" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md flex justify-between items-center"
            >
              {getLangLabel(lang)} <span>▼</span>
            </button>
            {dropdownOpen && (
              <div className="absolute mt-2 w-full bg-[#111] border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {LANGS.map((l) => (
                  <div
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer ${
                      lang === l.code
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    {l.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSpeak}
              className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
            >
              🔊 Generate Speech
            </button>

            {audioUrl && (
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
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

      {/* History Section */}
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
                    <td className="border px-4 py-2">
                      <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {getLangLabel(row.lang)}
                      </span>
                    </td>
                    <td className="border px-4 py-2 flex flex-wrap justify-center gap-4">
                      {row.audio_path && (
                        <button
                          onClick={() => new Audio(row.audio_path).play()}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <span className="text-white">▶</span>
                          <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Play
                          </span>
                        </button>
                      )}
                      {row.translated && (
                        <button
                          onClick={() => setPopupText(row.translated)}
                          className="flex items-center gap-1 hover:underline"
                        >
                          💬{' '}
                          <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Translated
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => confirmDelete(row.id, row.audio_path)}
                        className="flex items-center gap-1 hover:underline"
                      >
                        🗑{' '}
                        <span className="font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                          Delete
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 gap-2 flex-wrap">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gradient-to-r from-purple-400 to-pink-400 text-white disabled:opacity-50"
            >
              ⬅
            </button>
            {getPaginationNumbers().map((num, idx) => (
              <button
                key={idx}
                onClick={() => typeof num === 'number' && setPage(num)}
                className={`px-3 py-1 rounded ${
                  page === num
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                    : 'bg-gray-800 text-white'
                } ${typeof num !== 'number' && 'cursor-default'}`}
                disabled={typeof num !== 'number'}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gradient-to-r from-purple-400 to-pink-400 text-white disabled:opacity-50"
            >
              ➡
            </button>
          </div>
        )}
      </div>

      {/* Popup for Translated Text */}
      {popupText && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-600 text-white p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Translated Text</h3>
            <p className="mb-4 max-h-60 overflow-y-auto">{popupText}</p>
            <button
              onClick={() => setPopupText(null)}
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full text-white text-center">
            <h3 className="text-lg font-semibold mb-4">Delete Confirmation</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this TTS record?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={deleteNow}
                className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded hover:scale-105"
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