'use client';

import { useRef, useState, useEffect } from 'react';
import { Send, Volume2, User, Bot, Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hello! I'm your ElevenLabs documentation assistant. Ask me anything about ElevenLabs features, APIs, or services!",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/convo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const replyText = data.answer || 'Sorry, I couldn\'t process your request.';

      let audioUrl: string | undefined;
      try {
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: replyText }),
        });

        if (ttsResponse.ok) {
          const blob = await ttsResponse.blob();
          audioUrl = URL.createObjectURL(blob);
        }
      } catch (audioError) {
        console.log('Audio generation failed:', audioError);
      }

      const assistantMessage: Message = { role: 'assistant', text: replyText, audioUrl };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'There was an error processing your request.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(console.error);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
        console.log("Audio Blob:", audioBlob);
console.log("Blob size:", audioBlob.size);
console.log("Blob type:", audioBlob.type);


        const arrayBuffer = await audioBlob.arrayBuffer();

        const sttRes = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'audio/ogg' },
          body: arrayBuffer,
        });

        const sttData = await sttRes.json();
        setInput(sttData.text || ''); // Autofill input box
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access your microphone.');
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-black text-white">

      {/* Header */}
      <div className="bg-gray-900 shadow-sm border-b border-gray-800 px-6 py-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-gray-900">ElevenLabs Assistant</h1>
            <p className="text-sm text-gray-500">Ask me about ElevenLabs documentation</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-green-500' : 'bg-purple-500'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className="flex flex-col max-w-lg">
              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md border'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                {msg.audioUrl && (
                  <div className="mt-2 border-t pt-2 text-xs text-gray-500">
                    <button
                      onClick={() => playAudio(msg.audioUrl!)}
                      className="flex items-center gap-2 hover:text-blue-600"
                    >
                      <Volume2 className="w-4 h-4" />
                      Play Audio
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-black border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-center">
            <button
              onClick={handleMicClick}
              className={`w-12 h-12 flex items-center justify-center rounded-full ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic className="w-5 h-5 text-white" />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 px-4 py-3 border rounded-2xl resize-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
