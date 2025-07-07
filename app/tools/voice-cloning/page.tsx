// app/tools/voice-cloning/page.tsx
'use client';

import React, { useState, useRef } from 'react';

interface ElevenLabsError {
  detail?: {
    status: string;
    message?: string;
  };
}

export default function VoiceCloningPage() {
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [clonedAudioURL, setClonedAudioURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textToSpeak, setTextToSpeak] = useState('Hello, this is a test of voice cloning technology.');
  const [error, setError] = useState<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous error
      setError(null);
      
      // Check file type
      if (!file.type.startsWith('audio/')) {
        setError('Please select a valid audio file (MP3, WAV, etc.)');
        return;
      }
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Store the file and update state
      audioBlobRef.current = file;
      setAudioURL(URL.createObjectURL(file));
      setClonedAudioURL(null);
      
      // Reset form to allow re-selecting the same file
      e.target.value = '';
    }
  };

  const handleDeleteAudio = () => {
    audioBlobRef.current = null;
    setAudioURL(null);
    setError(null);
  };

  const handleVoiceClone = async () => {
    if (!audioBlobRef.current) {
      setError('Please upload an audio file');
      return;
    }
    if (!textToSpeak.trim()) {
      setError('Please enter text to speak');
      return;
    }
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('audio', audioBlobRef.current);
    formData.append('text', textToSpeak);
    formData.append('voiceId', 'zQzvQBubVkDWYuqJYMFn'); // Default or dummy voiceId

    try {
      const response = await fetch('/api/clone-voice', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Voice cloning failed');
      }
      const audioBlob = await response.blob();
      const clonedURL = URL.createObjectURL(audioBlob);
      setClonedAudioURL(clonedURL);
    } catch (err) {
      console.error('Voice cloning failed:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null) {
        const elevenLabsError = err as ElevenLabsError;
        // Check for subscription error
        if (elevenLabsError.detail?.status === 'can_not_use_instant_voice_cloning') {
          setError('Your subscription does not support instant voice cloning. Please upgrade your ElevenLabs subscription.');
        } else {
          setError('Voice cloning failed: ' + JSON.stringify(err, null, 2));
        }
      } else {
        setError('Voice cloning failed: ' + String(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadClonedAudio = () => {
    if (clonedAudioURL) {
      const a = document.createElement('a');
      a.href = clonedAudioURL;
      a.download = 'cloned-voice.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎙️ Voice Cloning Studio
            </h1>
            <p className="text-gray-300 text-lg">
              Upload your audio and create AI-powered voice clones
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
            {error && (
              <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
                <p className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-purple-300">
                1. Upload Audio Sample
              </h2>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className="cursor-pointer block w-full p-6 border-2 border-dashed border-purple-600 rounded-lg hover:border-purple-400 transition-colors text-center"
                >
                  <div className="text-purple-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-300">
                    Click to upload audio file (MP3, WAV, etc.)
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Max file size: 10MB
                  </p>
                </label>
              </div>
            </div>

            {audioURL && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3 text-green-300">
                  🎧 Original Audio
                </h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <audio controls src={audioURL} className="w-full" />
                  <button
                    onClick={handleDeleteAudio}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    🗑️ Delete Audio
                  </button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-purple-300">
                2. Enter Text to Speak
              </h2>
              <textarea
                value={textToSpeak}
                onChange={(e) => setTextToSpeak(e.target.value)}
                placeholder="Enter the text you want the cloned voice to speak..."
                className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-2">
                {textToSpeak.length}/500 characters
              </p>
            </div>

            <div className="mb-8">
              <button
                onClick={handleVoiceClone}
                disabled={isLoading || !audioBlobRef.current}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {isLoading ? 'Cloning Voice...' : '🧬 Clone Voice'}
              </button>
            </div>

            {clonedAudioURL && (
              <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-6">
                <h3 className="text-2xl font-semibold mb-4 text-green-300">
                  🗣️ Cloned Audio Result
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <audio controls src={clonedAudioURL} className="w-full mb-4" />
                  <button
                    onClick={downloadClonedAudio}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    📥 Download Cloned Audio
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 p-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-300">
                💡 Tips for Better Results
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Upload clear audio with minimal background noise</li>
                <li>• Use audio samples of at least 30 seconds for better quality</li>
                <li>• Speak clearly and at a normal pace in your sample</li>
                <li>• Keep the text reasonably short for best results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
