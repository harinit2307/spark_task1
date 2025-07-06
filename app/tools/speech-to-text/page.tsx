// app/tools/speech-to-text/page.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';

interface HistoryItem {
  id: string; // UUID for matching with IndexedDB audio
  text: string;
}

export default function SpeechToTextPage() {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [showText, setShowText] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [audioURLs, setAudioURLs] = useState<(string | null)[]>([]);
  const audioRefs = useRef<HTMLAudioElement[]>([]);

  // --- IndexedDB Setup ---
  const DB_NAME = 'speech-db';
  const STORE_NAME = 'audio-store';

  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveAudioToIndexedDB(id: string, blob: Blob) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, id);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function getAudioFromIndexedDB(id: string): Promise<string | null> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(URL.createObjectURL(result as Blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  const loadHistory = async () => {
    const saved = localStorage.getItem('transcriptionHistory');
    if (saved) {
      const parsed: HistoryItem[] = JSON.parse(saved);
      setHistory(parsed);

      const urls: (string | null)[] = await Promise.all(
        parsed.map((item) => getAudioFromIndexedDB(item.id))
      );
      setAudioURLs(urls);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    localStorage.setItem('transcriptionHistory', JSON.stringify(history));
  }, [history]);

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      audioBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 60000) {
      audioBlobRef.current = file;
      setAudioURL(URL.createObjectURL(file));
    } else {
      alert('File must be less than 60KB');
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
    if (!audioBlobRef.current) {
      alert('No audio selected or recorded.');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlobRef.current);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to transcribe');
      }

      const data = await res.json();
      setTranscription(data.text);
      setShowText(true);

      const id = crypto.randomUUID();
      await saveAudioToIndexedDB(id, audioBlobRef.current);
      const url = URL.createObjectURL(audioBlobRef.current);
      setAudioURLs((prev) => [...prev, url]);
      setHistory((prev) => [...prev, { id, text: data.text }]);
    } catch (err) {
      console.error('Transcription error:', err);
      alert(err instanceof Error ? err.message : 'Transcription failed.');
    }
  };

  const toggleHistory = () => setShowHistory((prev) => !prev);

  const deleteHistoryItem = (index: number) => {
    const item = history[index];
    openDB().then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(item.id);
      tx.oncomplete = () => {
        setHistory((prev) => prev.filter((_, i) => i !== index));
        setAudioURLs((prev) => prev.filter((_, i) => i !== index));
      };
    });
  };

  const playAudio = (index: number) => {
    const audioSrc = audioURLs[index];
    if (audioSrc && audioRefs.current[index]) {
      audioRefs.current[index].src = audioSrc;
      audioRefs.current[index].play();
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {showHistory && (
        <div className="w-72 border-r border-gray-800 p-4 overflow-y-auto bg-[#111]">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2 border-gray-700">🗂️ Transcription History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No past transcriptions.</p>
          ) : (
            history.map((item, index) => (
              <div key={item.id} className="mb-6 bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <button
                    onClick={() => playAudio(index)}
                    className="text-white hover:scale-110 transition text-xl"
                    title="Play Audio"
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => deleteHistoryItem(index)}
                    className="text-red-400 hover:underline text-xs font-medium"
                  >
                    🗑️ Remove
                  </button>
                </div>
                <audio ref={(el) => { if (el) audioRefs.current[index] = el }} hidden preload="auto" />
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{item.text}</p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="self-start mb-4">
          <button onClick={toggleHistory} className="text-2xl font-bold text-gray-400 px-3 py-1">⋮</button>
        </div>

        <div className="w-full max-w-3xl text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white">Speech to Text</h1>
          <p className="text-gray-400 mt-2">Convert your voice into text using ElevenLabs style UI</p>
        </div>

        <div className="w-full max-w-2xl bg-[#111] border border-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
            >
              🎙️ Start Recording
            </button>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                <span className="text-red-500 font-medium">Recording...</span>
              </div>
              <button
                onClick={handleStopRecording}
                className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
              >
                🛑 Stop Recording
              </button>
            </div>
          )}

          <div>
            <label className="block text-white mb-2 font-medium">Or Upload Audio File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full px-4 py-3 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-800 file:text-blue-300 hover:file:bg-gray-700 border border-gray-700 rounded-lg bg-black"
            />
          </div>

          {audioURL && (
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <audio controls src={audioURL} className="w-full mb-2" />
              <button
                onClick={handleDeleteAudio}
                className="text-red-400 hover:underline text-sm font-medium"
              >
                🗑️ Delete Audio
              </button>
            </div>
          )}

          <button
            onClick={handleTranscribe}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
          >
            📄 Show Transcription
          </button>

          {showText && transcription && (
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-2 text-center text-white">Transcribed Text</h3>
              <p className="text-center whitespace-pre-line text-gray-300">{transcription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
