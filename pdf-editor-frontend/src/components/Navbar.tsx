import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full  px-6 py-4 flex justify-between items-center bg-gray-50">
      <Link href="/" className="text-2xl font-bold text-gray-600">
        Free PDF Editor
      </Link>
      
      <div className="flex space-x-8 text-gray-600 font-medium">
        <Link href="/edit" className="hover:text-gray-800 hover:font-bold transition">Edit</Link>
        <Link href="/merge" className="hover:text-gray-800 hover:font-bold transition">Merge</Link>
        <Link href="/delete" className="hover:text-gray-800 hover:font-bold transition">Delete Pages</Link>
        <Link href="/compress" className="hover:text-gray-800 hover:font-bold transition">Compress</Link>
      </div>
    </nav>
  );
}