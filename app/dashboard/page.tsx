// app/dashboard/page.tsx
import TTSButton from '@/components/TTSButton';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-6">
      {/* Header */}
      <header className="w-full mb-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Text-to-Speech</h1>
            <p className="text-gray-200 text-sm">Convert text into natural-sounding speech</p>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-grow flex items-center justify-center">
        <TTSButton />
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto">
        <div className="bg-gradient-to-r from-gray-100 to-white rounded-t-lg shadow-lg">
          <div className="py-8 px-6 border-t-2 border-gray-300 text-center">
            <Link
              href="/speech-to-text"
              className="inline-block px-8 py-3 rounded-full border-2 border-blue-600 bg-blue-100 hover:bg-blue-200 hover:border-blue-700 transition-all duration-200 text-blue-600 font-semibold hover:text-blue-800 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <span className="inline-flex items-center space-x-2">
                <span>Go to Speech to Text</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
