'use client';
import dynamic from 'next/dynamic';
const PdfEditor = dynamic(() => import('../components/PdfEditor'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">PDF Editor</h1>
      <PdfEditor />
    </main>
  );
}