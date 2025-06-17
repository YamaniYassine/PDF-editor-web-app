'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface TextItem {
  text: string;
  original_text: string;
  x: number;
  y: number;
  font_size: number;
  width: number;
  font_name: string;
  is_bold: boolean;
  is_italic: boolean;
  page_number: number;
}

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scale = 1.5;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pdfFile = e.target.files?.[0] ?? null;
    if (!pdfFile) return;
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

  useEffect(() => {
    if (!pdf) return;
    (async () => {
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      setPageHeight(viewport.height);
      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    })();
  }, [pdf, currentPage]);

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
  const correctedPage = currentPage - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center space-y-10">
      <h1 className="text-4xl font-bold text-gray-800 text-center">Edit Your PDF for Free</h1>

      {!file && (
        <div
          className="w-full max-w-xl h-64 border-4 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <div className="text-5xl mb-2">+</div>
          <p className="text-lg">Drop file here or click to upload</p>
          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

{file && (
  <>
    <div
      className="relative shadow-xl border border-gray-300 rounded overflow-hidden bg-white"
      style={{ width: canvasRef.current?.width ?? 'auto', height: canvasRef.current?.height ?? 'auto' }}
    >
      <canvas ref={canvasRef} className="block" />
      {textItems
        .map((item, idx) => ({ ...item, idx }))
        .filter((it) => it.page_number === correctedPage)
        .map(({ idx, ...it }) => {
          const offsetY = it.font_size * scale * 1.3;
          const x = it.x * scale;
          const y = pageHeight - it.y * scale - offsetY;
          const isEditing = activeEditIndex === idx;

          return (
            <div
              key={idx}
              suppressContentEditableWarning
              contentEditable={isEditing}
              onClick={() => setActiveEditIndex(idx)}
              onBlur={(e) => {
                updateText(idx, e.currentTarget.textContent || '');
                setActiveEditIndex(null);
              }}
              className="absolute"
              style={{
                top: y,
                left: x,
                fontSize: it.font_size * scale,
                width: it.width * scale,
                fontWeight: it.is_bold ? 'bold' : 'normal',
                fontStyle: it.is_italic ? 'italic' : 'normal',
                fontFamily: 'Helvetica, sans-serif',
                whiteSpace: 'nowrap',
                userSelect: 'text',
                cursor: isEditing ? 'text' : 'pointer',
                zIndex: isEditing ? 10 : 2,
                opacity: isEditing ? 1 : 0,
                backgroundColor: isEditing ? 'white' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isEditing) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditing) {
                  e.currentTarget.style.opacity = '0';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {it.text}
            </div>
          );
        })}
    </div>

          {/* Page navigation */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              Page {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
              disabled={currentPage === numPages}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Save Edited PDF
          </button>
        </>
      )}
    </div>
  );
}
