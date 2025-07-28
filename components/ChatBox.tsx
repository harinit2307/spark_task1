'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'user' | 'gemini';
  text: string;
}

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/convo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage: Message = { sender: 'gemini', text: data.text || 'No response received.' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'gemini', text: '⚠️ Error retrieving response.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto mt-10 border rounded-2xl bg-[#111827] p-4 shadow-lg">
      <h2 className="text-2xl font-bold text-center text-white mb-4">💬 Gemini Chatbot</h2>

      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[75%] p-3 rounded-xl text-sm ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white self-end'
                : 'bg-gray-700 text-white self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-600 resize-none"
          rows={2}
        />
        <button
          onClick={sendMessage}
          className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
