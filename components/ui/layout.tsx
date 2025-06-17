// components/ui/Layout.tsx
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      {/* Header */}
      <header className="bg-gray-200 p-4 text-center text-2xl font-bold shadow">
        Text to Speech App
      </header>

      {/* Main */}
      <main className="flex-grow p-6 flex items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 p-4 text-center shadow-inner">
        <Link href="/speech-to-text" className="text-blue-600 hover:underline">
          Go to Speech to Text
        </Link>
      </footer>
    </div>
  );
}
