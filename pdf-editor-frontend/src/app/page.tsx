'use client';
import dynamic from 'next/dynamic';
import "./globals.css";
const PdfEditor = dynamic(() => import('../components/PdfEditor'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="bg-purple-600 text-white text-2xl p-6 rounded shadow">
        Free PDF Editor.
      </div>
      <PdfEditor />
    </main>
  );
}