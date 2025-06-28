'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import axios from 'axios';
import { saveAs } from 'file-saver';

import FileUploader from './FileUploader';
import PageThumbnails from './PageThumbnails';
import ToolGrid from './ToolGrid';

export default function PdfDeleter() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]);
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
    const data = await pdfFile.arrayBuffer();
    const loadedPdf = await pdfjsLibRef.current.getDocument({ data }).promise;
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
    form.append('pages_to_delete', JSON.stringify(pagesToDelete));

    const resp = await axios.post('http://localhost:8000/api/delete-pages', form, {
      responseType: 'blob',
    });

    saveAs(resp.data, 'deleted.pdf');
  };

  return (
    <section className="min-h-screen py-16 px-4 bg-gray-50" style={{ paddingTop: '7%' }}>
      <div className="max-w-screen-xl mx-auto flex flex-col items-center space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
            Delete <span className="highlight-pdf">PDF</span> Pages
          </h1>
          <p className="mt-2 text-xl text-gray-600 max-w-xl mx-auto">
            Delete one or multi Pages from Your <span className="highlight-pdf">PDF</span>
          </p>
        </div>

        {!file && (
          <div className="w-full flex flex-col items-center gap-6">
            <FileUploader onFileSelect={handleFileSelect} />
            <ToolGrid currentTool="delete" />
          </div>
        )}

        {file && pdf && (
          <div className="flex flex-col items-center gap-10 w-full">
            <PageThumbnails
              pdf={pdf}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              containerClassName="flex-wrap justify-center gap-6"
              renderBelow={(pageNum) => (
                <button
                  onClick={() => toggleDelete(pageNum)}
                  className={`text-sm px-4 py-1 rounded-md transition font-medium ${
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
              disabled={!pagesToDelete.length}
              className={`px-8 py-3 rounded-lg shadow transition font-semibold ${
                pagesToDelete.length
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Delete Selected Pages
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
