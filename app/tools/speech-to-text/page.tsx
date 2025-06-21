'use client';

import React, { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase'; // adjust path if needed
const supabase = createClient();

export default function SpeechToTextPage() {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [showText, setShowText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (blob.size > 60000) {
        alert('Recording too large (max 60KB). Please record a shorter clip.');
        return;
      }
      audioBlobRef.current = blob;
      setAudioURL(URL.createObjectURL(blob));
      setFileName('recording.webm');
      setIsRecording(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 60000) {
      audioBlobRef.current = file;
      setAudioURL(URL.createObjectURL(file));
      setFileName(file.name);
    } else {
      alert('File must be less than 60KB');
    }
  };

  const handleDeleteAudio = () => {
    audioBlobRef.current = null;
    setAudioURL(null);
    setTranscription('');
    setShowText(false);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTranscribe = async () => {
    if (!audioBlobRef.current) {
      alert('No audio selected or recorded.');
      return;
    }

    setIsLoading(true);
    setShowText(false);

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

      const { error } = await supabase.from('transcriptions').insert([
        {
          file_name: fileName || 'unknown',
          transcription: data.text,
        },
      ]);
      if (error) {
        console.error('Supabase insert error:', error);
        alert('Failed to save transcription');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      alert(err instanceof Error ? err.message : 'Transcription failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white px-4 py-10 text-black">
      <header className="w-full mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-5 text-white text-center">
            <h1 className="text-4xl font-bold mb-1">Speech to Text</h1>
            <p className="text-gray-200 text-sm">Convert your speech into text instantly</p>
          </div>
        </div>
      </header>

      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-lg p-8 space-y-6">

        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
          >
            🎙️ Start Speaking
          </button>
        ) : (
          <>
            <div className="text-red-500 font-medium text-center">Recording…</div>
            <button
              onClick={handleStopRecording}
              className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
            >
              🛑 Stop 
            </button>
          </>
        )}

        <div>
          <label className="block text-gray-700 mb-2 font-medium">Or Upload Audio File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block w-full px-4 py-3 text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-100 file:text-blue-700 hover:file:bg-gray-200 border border-gray-300 rounded-lg"
          />
        </div>

        {audioURL && (
          <div className="bg-gray-100 p-1.5 rounded-lg border border-gray-200">
            <audio controls src={audioURL} className="w-full h-8 mb-0.5" />
            <div className="text-xs text-gray-600 mb-0.5">{fileName}</div>
            <button
              onClick={handleDeleteAudio}
              className="text-red-500 hover:underline text-xs font-medium"
            >
              🗑️ Delete
            </button>
          </div>
        )}

        <button
          onClick={handleTranscribe}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
        >
          📄 Show Transcription
        </button>

        {isLoading && <div className="text-center text-sm text-gray-500">Transcribing...</div>}

        {showText && transcription && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <div className="text-sm text-gray-500 mb-1">{fileName}</div>
            <p className="whitespace-pre-line text-black">{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
}
