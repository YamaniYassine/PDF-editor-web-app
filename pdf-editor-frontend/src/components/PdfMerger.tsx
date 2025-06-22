'use client';
import React, { useState } from 'react';
import axios from 'axios';

export default function PdfMerger() {
  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleMerge = async () => {
    if (!files || files.length < 2) return;

    const form = new FormData();
    Array.from(files).forEach((file) => form.append('files', file));

    try {
      const response = await axios.post('http://localhost:8000/api/merge', form, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      link.click();
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge PDFs');
    }
  };

  return (
    <div className="min-h-screen py-20 px-6 flex flex-col items-center space-y-8">
      <h1 className="text-4xl font-bold text-gray-800 text-center">Merge PDF Files</h1>

      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleFileChange}
        className="text-center"
      />

      
        <button
            onClick={handleMerge}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
            Merge PDF files
        </button>
    </div>
  );
}
