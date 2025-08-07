'use client';
import { useState } from 'react';
import AgentTable from '@/components/AgentTable';

export default function CreateAgentPage() {
  const [form, setForm] = useState({
    name: '',
    firstMessage: '',
    systemPrompt: '',
    language: 'en',
    llmModel: 'eleven-multilingual-v1',
    temperature: 0.5,
    voiceId: '',
    tools: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const onChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error || data));
      setResult(`✅ Agent ID: ${data.agent_id}`);
    } catch (err: any) {
      setResult(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Agent</h1>
      <div className="space-y-4 mb-8">
        {['name', 'firstMessage', 'systemPrompt', 'voiceId'].map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field}
            value={(form as any)[field]}
            onChange={onChange}
            className="w-full p-2 border rounded"
          />
        ))}
        <input
          name="llmModel"
          placeholder="LLM Model"
          value={form.llmModel}
          onChange={onChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="temperature"
          type="number"
          step="0.1"
          max={1}
          min={0}
          value={form.temperature}
          onChange={onChange}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-black rounded"
        >
          {loading ? 'Creating...' : 'Create Agent'}
        </button>
        {result && (
          <pre className="mt-4 p-2 bg-gray-100 text-black rounded text-sm">{result}</pre>
        )}
      </div>

      {/* Agent Table Section */}
      <h2 className="text-xl text-black font-semibold mb-2">Existing Agents</h2>
      <AgentTable />
    </div>
  );
}
