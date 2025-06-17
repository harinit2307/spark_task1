'use client';

import React, { useRef, useState } from 'react';

export default function SpeechToTextPage() {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [showText, setShowText] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // NEW

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // ✅ Clears file input
    }
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
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-100 py-10 px-4 overflow-hidden">
      <header className="w-full mb-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Speech to Text</h1>
            <p className="text-gray-200 text-sm">Convert your voice into text instantly</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={`px-6 py-3 font-medium rounded-lg border-2 border-transparent transition-all duration-200 ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <div className="border-2 border-gray-300 rounded-lg p-2 w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="text-black w-full"
          />
        </div>

        {audioURL && (
          <div className="border-2 border-gray-300 rounded-lg p-4 w-full">
            <audio controls src={audioURL} className="w-full mb-2" />
            <button
              onClick={handleDeleteAudio}
              className="text-sm text-red-600 underline hover:text-red-700"
            >
              Delete Audio
            </button>
          </div>
        )}

        <button
          onClick={handleTranscribe}
          className="px-6 py-3 bg-blue-600 text-black rounded-lg border-2 border-transparent hover:border-blue-700 transition-all duration-200 hover:bg-blue-700"
        >
          Show Transcription
        </button>

        {showText && transcription && (
          <div className="mt-6 p-4 bg-white text-black rounded-lg border-2 border-gray-300 w-full">
            <p className="text-center">
              {transcription}
            </p>
          </div>
        )}
      </div>

      <footer className="w-full mt-auto">
        <div className="bg-gradient-to-r from-gray-100 to-white rounded-t-lg shadow-lg">
          <div className="py-8 px-6 border-t-2 border-gray-300 text-center">
            <a href="/dashboard" className="inline-block px-8 py-3 rounded-full border-2 border-blue-600 bg-blue-100 hover:bg-blue-200 hover:border-blue-700 transition-all duration-200 text-blue-600 font-semibold hover:text-blue-800">
              Go to Text-to-Speech
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
