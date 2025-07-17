'use client';

import { useState } from 'react';

export default function ConvoAIPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/convo', {
      method: 'POST',
      body: JSON.stringify({ prompt: input }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setResponse(data.response);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Conversational AI (Gemini)</h1>
      <textarea
        rows={3}
        className="w-full border p-2 rounded mb-2"
        placeholder="Ask something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Ask
      </button>

      {response && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <strong>Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
