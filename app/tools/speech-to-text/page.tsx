'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface HistoryItem {
  id: string;
  audio_url: string;
  text: string;
  created_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpeechToTextPage() {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [showText, setShowText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('transcription_history')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setHistory(data as HistoryItem[]);
  };

  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const parts: BlobPart[] = [];
    recorder.ondataavailable = e => parts.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(parts, { type: 'audio/webm' });
      audioBlobRef.current = blob;
      setAudioURL(URL.createObjectURL(blob));
    };
    mediaRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const handleStop = () => {
    mediaRef.current?.stop();
    setIsRecording(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 60000) {
      audioBlobRef.current = file;
      setAudioURL(URL.createObjectURL(file));
    } else {
      alert('File must be smaller than 60KB.');
    }
  };

  const handleDeleteAudio = () => {
    audioBlobRef.current = null;
    setAudioURL(null);
    setTranscription('');
    setShowText(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTranscribe = async () => {
    if (!audioBlobRef.current) return alert('Please record or upload audio first.');

    const fd = new FormData();
    fd.append('audio', audioBlobRef.current);

    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      const { text } = await res.json();
      setTranscription(text);
      setShowText(true);

      const fileName = `audio-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, audioBlobRef.current!, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicURLData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      const publicURL = publicURLData?.publicUrl;

      if (!publicURL) throw new Error('Could not get public URL');

      await supabase
        .from('transcription_history')
        .insert([{ audio_url: publicURL, text }]);

      await fetchHistory();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Transcription failed.');
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-purple via-black to-blue-900 text-white">
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Speech to Text
        </h1>
        <p className="text-gray-400 mt-2">
          Convert speech to text and save it securely
        </p>
      </div>

      <div className="w-full max-w-2xl bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
      <div className="flex flex-col gap-4">
  {!isRecording ? (
    <button
      onClick={handleStart}
      className="w-full bg-gradient-to-r from-purple-400 to-pink-400 py-3 rounded-lg"
    >
      🎙️ Start Speaking
    </button>
  ) : (
    <button
      onClick={handleStop}
      className="w-full bg-gradient-to-r from-purple-400 to-pink-400 py-3 rounded-lg"
    >
      🛑 Stop Speaking
    </button>
  )}

  <input
    ref={fileInputRef}
    type="file"
    accept="audio/*"
    onChange={handleUpload}
    className="block w-full bg-gray-800 border border-gray-700 rounded-lg py-2 text-white"
  />

  {audioURL && (
    <div className="bg-gray-900 p-4 rounded-lg flex justify-between items-center">
      <audio controls src={audioURL} className="flex-1" />
      <button onClick={handleDeleteAudio} className="text-red-400 ml-4">🗑️</button>
    </div>
  )}

  <button
    onClick={handleTranscribe}
    className="w-full bg-gradient-to-r from-purple-400 to-pink-400 py-3 rounded-lg"
  >
    📄 Transcribe
  </button>
</div>



        {showText && (
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-300 whitespace-pre-wrap">{transcription}</p>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="w-full max-w-4xl mt-10 bg-[#111] p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-center">Transcription History</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800">
                <th className="border px-4 py-2">#</th>
                <th className="border px-4 py-2">Transcribed Text</th>
                <th className="border px-4 py-2">Input Audio</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4">
                    No transcription history found.
                  </td>
                </tr>
              ) : (
                history.map((item, index) => (
                  <tr key={item.id} className="bg-gray-900">
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2 max-w-sm truncate">{item.text}</td>
                    <td className="border px-4 py-2 text-center">
                      <a
                        href={item.audio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        ▶️ Play
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
