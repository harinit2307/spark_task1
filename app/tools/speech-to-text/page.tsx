'use client';

import React, { useRef, useState } from 'react';

export default function SpeechToTextPage() {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [showText, setShowText] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      audioBlobRef.current = blob;
      setAudioURL(URL.createObjectURL(blob));
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
    } catch (err) {
      console.error('Transcription error:', err);
      alert(err instanceof Error ? err.message : 'Transcription failed.');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white px-4 py-10 text-black">
      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-4xl font-extrabold">Speech to Text</h1>
        <p className="text-gray-500 mt-2">Convert your voice into text using ElevenLabs style UI</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-lg p-8 space-y-6 transition-all duration-300">
        {/* Recording Section */}
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
              <span className="text-red-600 font-medium">Recording...</span>
            </div>
            <button
              onClick={handleStopRecording}
              className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
            >
              🛑 Stop Recording
            </button>
          </div>
        )}

        {/* File Upload */}
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

        {/* Audio Preview */}
        {audioURL && (
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <audio controls src={audioURL} className="w-full mb-2" />
            <button
              onClick={handleDeleteAudio}
              className="text-red-500 hover:underline text-sm font-medium"
            >
              🗑️ Delete Audio
            </button>
          </div>
        )}

        {/* Transcribe Button */}
        <button
          onClick={handleTranscribe}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition"
        >
          📄 Show Transcription
        </button>

        {/* Transcription Output */}
        {showText && transcription && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <h3 className="text-lg font-semibold mb-2 text-center text-gray-800">Transcribed Text</h3>
            <p className="text-center whitespace-pre-line text-black">{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
}
