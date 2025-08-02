'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface SpeechToTextProps {
  onTranscribe: (transcribedText: string) => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({ onTranscribe }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isRecording && audioChunks.current.length > 0) {
      const handleData = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioBase64 = await blobToBase64(audioBlob);

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: audioBase64 }),
          });

          const data = await res.json();
          if (data?.text) {
            onTranscribe(data.text);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        }
      };

      handleData();
    }
  }, [isRecording, onTranscribe]);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunks.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => setIsRecording(false);
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    } else {
      mediaRecorderRef.current?.stop();
    }
  };

  return (
    <button
      onClick={toggleRecording}
      className="p-3 rounded-full bg-black text-white shadow-lg fixed bottom-4 right-4 z-50"
    >
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export default SpeechToText;
