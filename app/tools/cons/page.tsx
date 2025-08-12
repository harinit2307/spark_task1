'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Disable SSR to avoid hydration errors
const Conversation = dynamic(
  () => import('../../../components/conversation').then(mod => mod.Conversation),
  { ssr: false }
);

export default function Page() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId') || '';

  return (
    <main className="flex flex-col items-center justify-center bg-black p-8 flex-1 w-full min-h-screen">
      {/* Heading */}
      <h1 className="text-4xl font-bold text-purple-400 mb-2 text-center">
        Conversational Interface
      </h1>
      <p className="text-gray-300 mb-10 text-center max-w-xl">
        Real-time AI chatbot for natural and interactive conversations.
      </p>

      {/* Conversation UI */}
      <Conversation agentId={agentId} />
    </main>
  );
}
