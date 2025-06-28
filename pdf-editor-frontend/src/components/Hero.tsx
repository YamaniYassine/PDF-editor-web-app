import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex  justify-center px-6 bg-gradient-to-b from-white to-gray-50" style={{ paddingTop: '10%' }}>
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
          We help with your <span className="highlight-pdf">PDF</span> tasks
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-10">
          Easy, pleasant, and productive <span className="highlight-pdf">PDF</span> editing for everyone — for free.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/edit">
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow transition">
              Edit a PDF – it's free
            </button>
          </Link>
          <Link href="/merge">
            <button className="text-green-600 border border-green-600 hover:bg-green-100 font-semibold px-8 py-3 rounded-lg transition">
              Merge PDFs
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
