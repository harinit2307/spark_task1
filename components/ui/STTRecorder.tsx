// components/ui/STTRecorder.tsx
'use client';
import { useState, useRef } from 'react';

export default function STTRecorder() {
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks: Blob[] = [];

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.mp3');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setTranscript(JSON.stringify(data, null, 2));
    };
    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded text-white ${recording ? 'bg-red-500' : 'bg-green-600'}`}
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <pre className="bg-gray-100 text-black p-2 rounded whitespace-pre-wrap">{transcript}</pre>
    </div>
  );
}
