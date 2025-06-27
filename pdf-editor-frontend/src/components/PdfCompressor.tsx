'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import FileUploader from './FileUploader';
import PageThumbnails from './PageThumbnails';

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
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

  const handleFileSelect = async (pdfFileOrFiles: File | File[]) => {
    const pdfFile = Array.isArray(pdfFileOrFiles) ? pdfFileOrFiles[0] : pdfFileOrFiles;
    setFile(pdfFile);

    if (pdfjsLibRef.current && pdfFile) {
      const data = await pdfFile.arrayBuffer();
      const loadedPdf = await pdfjsLibRef.current.getDocument({ data }).promise;
      setPdf(loadedPdf);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    const resp = await axios.post('http://localhost:8000/api/compress', form, {
      responseType: 'blob',
    });

    saveAs(resp.data, 'compressed.pdf');
  };

  return (
    <section className="min-h-screen py-16 px-4 bg-gray-50" style={{ paddingTop: '7%' }}>
      <div className="max-w-screen-xl mx-auto flex flex-col items-center space-y-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 text-center">
          Compress Your PDF
        </h1>

        {!file && <FileUploader onFileSelect={handleFileSelect} />}

        {file && pdf && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <PageThumbnails
              pdf={pdf}
              currentPage={1}
              setCurrentPage={() => {}}
              containerClassName="flex-col"
              limitPages={1}
            />

            <button
              onClick={handleCompress}
              className="px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-semibold"
            >
              Compress PDF
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
