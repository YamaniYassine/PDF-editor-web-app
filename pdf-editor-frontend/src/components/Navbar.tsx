'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="w-full bg-gray-50 relative z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto w-full px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-600">
          Free PDF Editor
        </Link>

        <button
          className="sm:hidden text-2xl text-gray-600"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Desktop menu version */}
        <ul className="hidden sm:flex space-x-8 text-gray-600 font-medium">
          <li>
            <Link href="/edit" className="hover:text-gray-800 hover:font-bold transition">
              Edit
            </Link>
          </li>
          <li>
            <Link href="/merge" className="hover:text-gray-800 hover:font-bold transition">
              Merge
            </Link>
          </li>
          <li>
            <Link href="/delete" className="hover:text-gray-800 hover:font-bold transition">
              Delete Pages
            </Link>
          </li>
          <li>
            <Link href="/compress" className="hover:text-gray-800 hover:font-bold transition">
              Compress
            </Link>
          </li>
        </ul>

        {/* Mobile dropdown menu version */}
        {isOpen && (
          <ul
            className="absolute top-full right-4 mt-2 w-40 bg-gray-50 flex flex-col items-end space-y-2 text-gray-600 font-medium sm:hidden shadow-lg p-4 rounded-md
              animate-fade-in"
            role="menu"
            aria-label="Mobile menu"
          >
            <li>
              <Link
                href="/edit"
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-800 hover:font-bold transition block w-full text-right"
                role="menuitem"
              >
                Edit
              </Link>
            </li>
            <li>
              <Link
                href="/merge"
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-800 hover:font-bold transition block w-full text-right"
                role="menuitem"
              >
                Merge
              </Link>
            </li>
            <li>
              <Link
                href="/delete"
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-800 hover:font-bold transition block w-full text-right"
                role="menuitem"
              >
                Delete Pages
              </Link>
            </li>
            <li>
              <Link
                href="/compress"
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-800 hover:font-bold transition block w-full text-right"
                role="menuitem"
              >
                Compress
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
