'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import FileUploader from './FileUploader';
import PageThumbnails from './PageThumbnails';
import ToolGrid from './ToolGrid';
import { API_BASE_URL } from '../lib/api';

interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [isPdfJsReady, setIsPdfJsReady] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pdfjsLibRef = useRef<typeof import('pdfjs-dist/webpack.mjs') | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfjsLib = await import('pdfjs-dist/webpack.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      pdfjsLibRef.current = pdfjsLib;
      setIsPdfJsReady(true);
    };

    loadPdfJs();
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleFileSelect = async (pdfFileOrFiles: File | File[]) => {
    const pdfFile = Array.isArray(pdfFileOrFiles) ? pdfFileOrFiles[0] : pdfFileOrFiles;
    if (!pdfjsLibRef.current) {
      setError('The compressor is still loading. Please choose your PDF again in a moment.');
      return;
    }

    setIsLoadingFile(true);
    setError(null);
    setResult(null);
    try {
      const data = await pdfFile.arrayBuffer();
      const loadedPdf = await pdfjsLibRef.current.getDocument({ data }).promise;
      setFile(pdfFile);
      setPdf(loadedPdf);
      setProgress(0);
    } catch {
      setError('We could not open this PDF. Please choose another PDF file.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setError(null);
    setResult(null);
    setProgress(6);
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current < 70) return Math.min(current + 7, 70);
        if (current < 94) return Math.min(current + 1, 94);
        return current;
      });
    }, 350);

    const form = new FormData();
    form.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/compress`, form, {
        responseType: 'blob',
        onUploadProgress: (event) => {
          const total = event.total;
          if (total) setProgress((current) => Math.max(current, Math.round((event.loaded / total) * 25)));
        },
      });
      stopProgressTimer();
      setProgress(100);
      setResult({
        blob: response.data,
        originalSize: file.size,
        compressedSize: response.data.size,
      });
    } catch {
      setError('Your PDF could not be compressed. Please try again.');
      setProgress(0);
    } finally {
      stopProgressTimer();
      setIsCompressing(false);
    }
  };

  const savings = result ? ((result.originalSize - result.compressedSize) / result.originalSize) * 100 : 0;

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-16" style={{ paddingTop: '7%' }}>
      <div className="mx-auto flex max-w-screen-xl flex-col items-center space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-gray-800 sm:text-5xl">
            Compress Your <span className="highlight-pdf">PDF</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xl text-gray-600">
            Optimise your PDF file size while keeping its visual quality.
          </p>
        </div>

        {!file ? (
          <div className="flex w-full flex-col items-center gap-3">
            <FileUploader onFileSelect={handleFileSelect} />
            {!isPdfJsReady && <p className="text-sm text-gray-500">Preparing the compressor…</p>}
            {isLoadingFile && <p className="text-sm text-gray-500">Opening your PDF…</p>}
          </div>
        ) : (
          <div className="flex w-full max-w-4xl flex-col items-center gap-7">
            <div className="relative w-full overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
              <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-7">
                {pdf && (
                  <div className="flex shrink-0 justify-center rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
                    <PageThumbnails
                      pdf={pdf}
                      currentPage={1}
                      setCurrentPage={() => {}}
                      containerClassName="flex-col overflow-visible p-0 max-h-none"
                      limitPages={1}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                    Original PDF
                  </span>
                  <p className="mt-3 truncate text-xl font-semibold text-gray-800" title={file.name}>{file.name}</p>
                  <p className="mt-1 text-sm text-gray-500">Ready to be optimised</p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">File size</p>
                      <p className="mt-1 font-semibold text-gray-800">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pages</p>
                      <p className="mt-1 font-semibold text-gray-800">{pdf?.numPages ?? '—'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPdf(null);
                      setResult(null);
                      setProgress(0);
                      setError(null);
                    }}
                    disabled={isCompressing}
                    className="mt-5 rounded-lg border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                  >
                    Replace PDF
                  </button>
                </div>
              </div>
            </div>

            {isCompressing && (
              <div className="w-full max-w-xl" aria-live="polite">
                <div className="mb-2 flex justify-between text-sm text-gray-600">
                  <span>Optimising your PDF…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-green-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {result && (
              <div className="w-full max-w-xl rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                <p className="text-lg font-semibold text-green-800">Your compressed PDF is ready</p>
                <div className="mt-3 flex justify-center gap-6 text-sm text-green-900">
                  <span>{formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)}</span>
                  <span>{savings >= 0 ? `${savings.toFixed(1)}% smaller` : `${Math.abs(savings).toFixed(1)}% larger`}</span>
                </div>
                <button
                  type="button"
                  onClick={() => saveAs(result.blob, 'compressed.pdf')}
                  className="mt-5 rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-green-700"
                >
                  Download Compressed PDF
                </button>
              </div>
            )}

            {!result && (
              <button
                type="button"
                onClick={handleCompress}
                disabled={isCompressing}
                className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isCompressing ? 'Compressing PDF…' : 'Compress PDF'}
              </button>
            )}
          </div>
        )}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <ToolGrid currentTool="compress" />
      </div>
    </section>
  );
}
