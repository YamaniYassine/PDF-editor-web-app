'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="w-full bg-green-100/65 relative z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto w-full px-4 py-3 flex flex-row-reverse sm:flex-row justify-between items-center gap-4">

      <a href="/" className="flex items-center space-x-2">
        <Image
          src="/PDF-logo.svg"
          alt="PDF Editor Logo"
          width={80}
          height={40}
          priority
        />
      </a>

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
            <Link href="/edit" className="hover:text-green-600 hover:font-bold transition">
              Edit
            </Link>
          </li>
          <li>
            <Link href="/merge" className="hover:text-green-600 hover:font-bold transition">
              Merge
            </Link>
          </li>
          <li>
            <Link href="/delete" className="hover:text-green-600 hover:font-bold transition">
              Delete Pages
            </Link>
          </li>
          <li>
            <Link href="/compress" className="hover:text-green-600 hover:font-bold transition">
              Compress
            </Link>
          </li>
        </ul>

        {/* Mobile dropdown menu version */}
        {isOpen && (
          <ul
          className="absolute top-full left-4 mt-3 w-44 bg-white border border-gray-200 rounded-xl shadow-lg sm:hidden animate-fade-in z-50"
          role="menu"
          aria-label="Mobile menu"
        >
          {[
            { label: 'Edit', href: '/edit' },
            { label: 'Merge', href: '/merge' },
            { label: 'Delete Pages', href: '/delete' },
            { label: 'Compress', href: '/compress' },
          ].map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="block w-full px-5 py-3 text-left text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        
        )}
      </div>
    </nav>
  );
}
