'use client';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import FileUploader from './FileUploader';
import PDFCanvas from './PDFCanvas';
import Pagination from './Pagination';
import PageThumbnails from './PageThumbnails';
import type { TextItem } from './types';

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);
  const pdfjsLibRef = useRef<any>(null);

  const scale = 1.5;

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

    if (!pdfjsLibRef.current) return;

    const loadedPdf = await pdfjsLibRef.current.getDocument({ data }).promise;
    setPdf(loadedPdf);
    setNumPages(loadedPdf.numPages);
    setCurrentPage(1);

    const form = new FormData();
    form.append('file', pdfFile);
    const resp = await axios.post('http://localhost:8000/api/extract', form);
    setTextItems(resp.data.items);
  };

  const handleSave = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('edits', JSON.stringify(textItems));
    const resp = await axios.post('http://localhost:8000/api/replace', form, {
      responseType: 'blob',
    });
    saveAs(resp.data, 'edited.pdf');
  };

  const updateText = (idx: number, newText: string) => {
    setTextItems((prev) => {
      const arr = [...prev];
      arr[idx].text = newText;
      return arr;
    });
  };

  return (
    <section className="min-h-screen py-16 px-4 bg-gray-50" style={{ paddingTop: '7%' }}>
      <div className="max-w-screen-xl mx-auto flex flex-col items-center space-y-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 text-center">
          Edit Your PDF for Free
        </h1>

        {!file && <FileUploader onFileSelect={handleFileSelect} />}

        {file && pdf && (
          <div className="flex flex-col lg:flex-row w-full gap-8 justify-center items-start">
            <PageThumbnails
              pdf={pdf}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />

            <div className="flex flex-col items-center w-full">
              <PDFCanvas
                pdf={pdf}
                currentPage={currentPage}
                scale={scale}
                textItems={textItems}
                pageHeight={pageHeight}
                setPageHeight={setPageHeight}
                activeEditIndex={activeEditIndex}
                setActiveEditIndex={setActiveEditIndex}
                updateText={updateText}
              />

              <Pagination
                currentPage={currentPage}
                numPages={numPages}
                setCurrentPage={setCurrentPage}
              />

              <button
                onClick={handleSave}
                className="mt-8 px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
              >
                Save Edited PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
