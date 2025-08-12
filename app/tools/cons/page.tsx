'use client';

import dynamic from 'next/dynamic';

// Disable SSR to avoid hydration errors
const Conversation = dynamic(
  () => import('../../../components/conversation').then(mod => mod.Conversation),
  { ssr: false }
);

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center bg-black p-8 flex-1 w-full">
      {/* Single Heading */}
      <h1 className="text-6xl font-bold text-pink-400 mb-10 flex items-center gap-3">
        🎧 Voice Connect
      </h1>

      {/* Conversation UI */}
      <Conversation />
    </main>
  );
}
