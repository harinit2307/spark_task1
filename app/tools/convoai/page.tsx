'use client';

import { useState } from 'react';

export default function ConvoAI() {
  const [messages, setMessages] = useState([
    { role: 'user', content: 'Hello!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setLoading(true);
    setInput('');

    const res = await fetch('/api/convo', {
      method: 'POST',
      body: JSON.stringify({ messages: newMessages }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (data.message) {
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4 text-white">🧠 Conversational AI</h1>

      <div className="space-y-2 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
            }`}
          >
            <p className="text-black">
              <strong className="capitalize">{msg.role}:</strong> {msg.content}
            </p>
          </div>
        ))}
        {loading && <div className="italic text-gray-600">Typing...</div>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border border-gray-300 px-2 py-1 rounded text-black"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
