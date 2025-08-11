'use client';

import dynamic from 'next/dynamic';

// ⛔ SSR disabled to avoid hydration error
const Conversation = dynamic(() => import('../../../components/conversation').then(mod => mod.Conversation), {
  ssr: false,
});

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-black font-bold mb-4 text-center">🎧 Talk to your Agent</h1>
        <Conversation />
      </div>
    </main>
  );
}