'use client';
import React, { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageThumbnailsProps {
  pdf: PDFDocumentProxy;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export default function PageThumbnails({ pdf, currentPage, setCurrentPage }: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  useEffect(() => {
    const generateThumbnails = async () => {
      const thumbs: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context!, viewport }).promise;
        thumbs.push(canvas.toDataURL());
      }

      setThumbnails(thumbs);
    };

    generateThumbnails();
  }, [pdf]);

  return (
    <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-2 border-l">
      {thumbnails.map((src, idx) => {
        const pageNum = idx + 1;
        return (
          <img
            key={pageNum}
            src={src}
            onClick={() => setCurrentPage(pageNum)}
            className={`cursor-pointer border-2 rounded-md ${
              pageNum === currentPage ? 'border-blue-600' : 'border-transparent'
            } hover:border-blue-400 transition`}
            alt={`Page ${pageNum}`}
          />
        );
      })}
    </div>
  );
}