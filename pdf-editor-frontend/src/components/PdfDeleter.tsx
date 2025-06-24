'use client';

import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import axios from 'axios';
import { saveAs } from 'file-saver';

import FileUploader from './FileUploader';
import PageThumbnails from './PageThumbnails';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfDeleter() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]);

  const handleFileSelect = async (pdfFile: File) => {
    setFile(pdfFile);
    const data = await pdfFile.arrayBuffer();
    const loadedPdf = await pdfjsLib.getDocument({ data }).promise;
    setPdf(loadedPdf);
    setCurrentPage(1);
  };

  const toggleDelete = (pageNum: number) => {
    setPagesToDelete((prev) =>
      prev.includes(pageNum)
        ? prev.filter((num) => num !== pageNum)
        : [...prev, pageNum]
    );
  };

  const handleDelete = async () => {
    if (!file || !pagesToDelete.length) return;
    const form = new FormData();
    form.append('file', file);
    form.append('pages', JSON.stringify(pagesToDelete));

    const resp = await axios.post('http://localhost:8000/api/delete', form, {
      responseType: 'blob',
    });

    saveAs(resp.data, 'deleted.pdf');
  };

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center space-y-10" style={{ marginTop: '5%' }}>
      <h1 className="text-4xl font-bold text-gray-800 text-center">Delete Pages from Your PDF</h1>

      {!file && <FileUploader onFileSelect={handleFileSelect} />}

      {file && pdf && (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
          <PageThumbnails
            pdf={pdf}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            containerClassName="flex-row"
            renderBelow={(pageNum) => (
              <button
                onClick={() => toggleDelete(pageNum)}
                className={`text-sm px-3 py-1 rounded-md transition ${
                  pagesToDelete.includes(pageNum)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                }`}
              >
                {pagesToDelete.includes(pageNum) ? 'Undo' : 'Delete'}
              </button>
            )}
          />

          <button
            onClick={handleDelete}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
          >
            Delete Selected Pages
          </button>
        </div>
      )}
    </div>
  );
}
