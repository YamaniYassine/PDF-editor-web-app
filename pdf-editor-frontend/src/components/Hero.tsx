import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative w-full min-h-screen flex justify-center text-center px-6 overflow-hidden" style={{ marginTop: '15%' }}>
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
          We help with your PDF tasks
        </h1>
        <p className="text-xl text-green-600 mb-8">
          Easy, pleasant and productive PDF editor
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Link href="/edit">
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-md shadow">
            Edit a PDF document – it's free
          </button>
        </Link>
        </div>
      </div>
    </div>
  );
}
