'use client';
import dynamic from 'next/dynamic';
import "./globals.css";

import Hero from '@/components/Hero';
const PdfEditor = dynamic(() => import('@/components/PdfEditor'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen py-5 bg-gray-50">
      <Hero />
    </main>
  );
}