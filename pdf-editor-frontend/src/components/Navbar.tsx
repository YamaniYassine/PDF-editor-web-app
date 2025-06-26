'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="w-full bg-gray-50 relative z-50">
      <div className="max-w-screen-xl mx-auto w-full px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-600">
          Free PDF Editor
        </Link>

        <button
          className="sm:hidden text-2xl text-gray-600"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Desktop menu version */}
        <div className="hidden sm:flex space-x-8 text-gray-600 font-medium">
          <Link href="/edit" className="hover:text-gray-800 hover:font-bold transition">Edit</Link>
          <Link href="/merge" className="hover:text-gray-800 hover:font-bold transition">Merge</Link>
          <Link href="/delete" className="hover:text-gray-800 hover:font-bold transition">Delete Pages</Link>
          <Link href="/compress" className="hover:text-gray-800 hover:font-bold transition">Compress</Link>
        </div>

        {/* Mobile dropdown menu version */}
        {isOpen && (
          <div className="absolute top-full right-6 mt-2 bg-gray-50 flex flex-col items-end space-y-2 text-gray-600 font-medium sm:hidden shadow-lg p-4 rounded-md">
            <Link href="/edit" onClick={() => setIsOpen(false)} className="hover:text-gray-800 hover:font-bold transition">Edit</Link>
            <Link href="/merge" onClick={() => setIsOpen(false)} className="hover:text-gray-800 hover:font-bold transition">Merge</Link>
            <Link href="/delete" onClick={() => setIsOpen(false)} className="hover:text-gray-800 hover:font-bold transition">Delete Pages</Link>
            <Link href="/compress" onClick={() => setIsOpen(false)} className="hover:text-gray-800 hover:font-bold transition">Compress</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
