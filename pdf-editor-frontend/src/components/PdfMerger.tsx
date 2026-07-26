'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiMenu, FiPlus, FiTrash2 } from 'react-icons/fi';

import FileUploader from './FileUploader';
import PageThumbnails from './PageThumbnails';
import ToolGrid from './ToolGrid';
import { API_BASE_URL } from '../lib/api';

interface MergeFile {
  id: string;
  file: File;
  pdf: PDFDocumentProxy;
}

export default function PdfMerger() {
  const [mergeFiles, setMergeFiles] = useState<MergeFile[]>([]);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfjsLibRef = useRef<typeof import('pdfjs-dist/webpack.mjs') | null>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

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
    if (!pdfjsLibRef.current) {
      setError('The merger is still loading. Please choose your files again in a moment.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const loadedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const data = await file.arrayBuffer();
          const pdf = await pdfjsLibRef.current.getDocument({ data }).promise;
          return {
            id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
            file,
            pdf,
          };
        })
      );
      setMergeFiles((previous) => [...previous, ...loadedFiles]);
    } catch {
      setError('One or more files could not be opened. Please use valid PDF files.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (id: string) => {
    setMergeFiles((previous) => {
      const removed = previous.find((entry) => entry.id === id);
      void removed?.pdf.destroy();
      return previous.filter((entry) => entry.id !== id);
    });
  };

  const moveFile = (targetId: string) => {
    if (!draggedFileId || draggedFileId === targetId || dragOverFileId === targetId) return;

    setDragOverFileId(targetId);
    setMergeFiles((previous) => {
      const fromIndex = previous.findIndex((entry) => entry.id === draggedFileId);
      const toIndex = previous.findIndex((entry) => entry.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return previous;
      const reordered = [...previous];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
  };

  const handleMerge = async () => {
    if (mergeFiles.length < 2) return;

    const form = new FormData();
    mergeFiles.forEach(({ file }) => form.append('files', file));

    setIsMerging(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/merge`, form, {
        responseType: 'blob',
      });
      saveAs(response.data, 'merged.pdf');
    } catch {
      setError('Your PDFs could not be merged. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  const canMerge = mergeFiles.length >= 2;

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-16" style={{ paddingTop: '7%' }}>
      <div className="mx-auto flex max-w-screen-xl flex-col items-center space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-gray-800 sm:text-5xl">
            Merge Your <span className="highlight-pdf">PDFs</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xl text-gray-600">
            Put your PDF files in the order you want, then merge them into one.
          </p>
        </div>

        {mergeFiles.length === 0 ? (
          <div className="flex w-full flex-col items-center gap-3">
            <FileUploader onFileSelect={handleFilesSelect} multiple />
            {isLoading && <p className="text-sm text-gray-500">Opening your PDFs…</p>}
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full overflow-x-auto pb-4">
              <div className="flex w-max min-w-full justify-center gap-4">
              {mergeFiles.map(({ id, file, pdf }, index) => (
                <div
                  key={id}
                  draggable
                  onDragStart={(event) => {
                    setDraggedFileId(id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', id);
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    moveFile(id);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDraggedFileId(null);
                    setDragOverFileId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedFileId(null);
                    setDragOverFileId(null);
                  }}
                  className={`relative flex w-48 shrink-0 cursor-grab flex-col items-center rounded-xl border bg-gray-50 p-3 transition-all duration-200 active:cursor-grabbing ${
                    draggedFileId === id
                      ? 'border-green-500 opacity-50'
                      : dragOverFileId === id
                        ? 'border-green-500 shadow-md ring-2 ring-green-100'
                        : 'border-gray-200 hover:border-green-400 hover:shadow-md'
                  }`}
                >
                  {dragOverFileId === id && draggedFileId !== id && (
                    <span className="absolute -left-2 top-4 h-12 w-1 rounded-full bg-green-500" aria-hidden="true" />
                  )}
                  <div className="mb-2 flex w-full items-center justify-between gap-2">
                    <span className="flex items-center text-sm font-semibold text-gray-700">
                      <FiMenu className="mr-1 text-gray-400" aria-hidden="true" />
                      PDF {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(id)}
                      className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${file.name}`}
                      title="Remove PDF"
                    >
                      <FiTrash2 aria-hidden="true" />
                    </button>
                  </div>
                  <PageThumbnails
                    pdf={pdf}
                    currentPage={1}
                    setCurrentPage={() => {}}
                    containerClassName="flex-col overflow-visible p-0 max-h-none"
                    limitPages={1}
                  />
                  <p className="mt-2 w-full truncate text-center text-xs text-gray-500" title={file.name}>{file.name}</p>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addFilesInputRef.current?.click()}
                className="flex min-h-64 w-48 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-gray-500 transition hover:border-green-500 hover:bg-green-50 hover:text-green-700"
              >
                <FiPlus className="mb-2 text-3xl" aria-hidden="true" />
                <span className="text-center font-medium">Add another PDF</span>
              </button>
              </div>
            </div>

            <input
              ref={addFilesInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.length) handleFilesSelect(Array.from(event.target.files));
                event.target.value = '';
              }}
            />

            <div className="mt-5 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleMerge}
                disabled={!canMerge || isMerging}
                title={!canMerge ? 'Add at least two PDFs to merge' : ''}
                className={`rounded-lg px-8 py-3 font-semibold text-white shadow transition ${
                  canMerge && !isMerging ? 'bg-green-600 hover:bg-green-700' : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
              >
                {isMerging ? 'Merging PDFs…' : 'Merge PDF Files'}
              </button>
              {!canMerge && <p className="text-sm text-gray-500">Add one more PDF to enable merging.</p>}
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <ToolGrid currentTool="merge" />
      </div>
    </section>
  );
}
