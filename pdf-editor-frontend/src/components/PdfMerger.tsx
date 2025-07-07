'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import axios from 'axios';
import { saveAs } from 'file-saver';

import FileUploader from './FileUploader';
import PageThumbnails from './PageThumbnails';
import ToolGrid from './ToolGrid'

export default function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [pdfs, setPdfs] = useState<PDFDocumentProxy[]>([]);
  const pdfjsLibRef = useRef<any>(null);

  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfjsLib = await import('pdfjs-dist/webpack.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      pdfjsLibRef.current = pdfjsLib;
    };

    loadPdfJs();
  }, []);

  const handleFilesSelect = async (newFiles: File | File[]) => {
    const selectedFiles = Array.isArray(newFiles) ? newFiles : [newFiles];

    const loadedPdfs: PDFDocumentProxy[] = [];
    for (const file of selectedFiles) {
      const data = await file.arrayBuffer();
      const pdf = await pdfjsLibRef.current.getDocument({ data }).promise;
      loadedPdfs.push(pdf);
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    setPdfs((prev) => [...prev, ...loadedPdfs]);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    const form = new FormData();
    files.forEach((file) => form.append('files', file));

    try {
      const response = await axios.post('http://localhost:8000/api/merge', form, {
        responseType: 'blob',
      });

      saveAs(response.data, 'merged.pdf');
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge PDFs');
    }
  };

  const canMerge = files.length >= 2;

  return (
    <section className="min-h-screen py-16 px-4 bg-gray-50" style={{ paddingTop: '7%' }}>
      <div className="max-w-screen-xl mx-auto flex flex-col items-center space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
            Merge Your <span className="highlight-pdf">PDFs</span>
          </h1>
          <p className="mt-2 text-xl text-gray-600 max-w-xl mx-auto">
            Merge two <span className="highlight-pdf">PDF</span> Files or more in One.
          </p>
        </div>

        {!canMerge && (
          <div className="w-full flex flex-col items-center gap-6">
            <FileUploader onFileSelect={handleFilesSelect} multiple/>
            <ToolGrid currentTool="merge" />
          </div>
        )}

        {pdfs.length > 0 && (
          <div className="w-full flex flex-col items-center space-y-8">
            <div className="flex flex-wrap justify-center gap-6 w-full max-w-full overflow-x-auto">
              {pdfs.map((pdf, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-600">PDF {idx + 1}</h3>
                  <PageThumbnails
                    pdf={pdf}
                    currentPage={1}
                    setCurrentPage={() => {}}
                    containerClassName="flex-col"
                    limitPages={1}
                  />
                </div>
              ))}
            </div>

            <div
              title={!canMerge ? 'Please upload at least 2 PDF files to merge' : ''}
            >
              <button
                onClick={handleMerge}
                disabled={!canMerge}
                className={`mt-4 px-8 py-3 rounded-lg shadow transition font-semibold ${
                  canMerge
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Merge PDF Files
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
