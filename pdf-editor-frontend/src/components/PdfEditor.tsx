'use client';
import { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import FileUploader from './FileUploader';
import PDFCanvas from './PDFCanvas';
import Pagination from './Pagination';
import PageThumbnails from './PageThumbnails';
import type { TextItem } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

  const scale = 1.5;

  const handleFileSelect = async (pdfFile: File) => {
    setFile(pdfFile);
    const data = await pdfFile.arrayBuffer();
    const loadedPdf = await pdfjsLib.getDocument({ data }).promise;
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
    <div className="min-h-scree py-12 px-4 flex flex-col items-center space-y-10" style={{ marginTop: '5%' }}>
      <h1 className="text-4xl font-bold text-gray-800 text-center">Edit Your PDF for Free</h1>

      {!file && <FileUploader onFileSelect={handleFileSelect} />}

      {file && pdf && (
        <div className="flex w-full gap-4 justify-center">
          <PageThumbnails
            pdf={pdf}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          <div className="flex flex-col items-center">
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
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Save Edited PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}