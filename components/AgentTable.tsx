'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgentTable() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents(data);
      }

      setLoading(false);
    };

    fetchAgents();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Agent List</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full table-auto border border-gray-200 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border">Agent Name</th>
              <th className="px-4 py-2 border">Created By</th>
              <th className="px-4 py-2 border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2 border">{agent.name}</td>
                <td className="px-4 py-2 border">{agent.created_by}</td>
                <td className="px-4 py-2 border">
                  {new Date(agent.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
