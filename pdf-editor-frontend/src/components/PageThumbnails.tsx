'use client';
import React, { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageThumbnailsProps {
  pdf: PDFDocumentProxy;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  renderBelow?: (pageNumber: number) => React.ReactNode;
  containerClassName?: string;
  limitPages?: number;
}

export default function PageThumbnails({
  pdf,
  currentPage,
  setCurrentPage,
  renderBelow,
  containerClassName,
  limitPages,
}: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  useEffect(() => {
    const generateThumbnails = async () => {
      const thumbs: string[] = [];

      for (let i = 1; i <= Math.min(pdf.numPages, limitPages ?? pdf.numPages); i++) {
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
    <div className={`flex gap-4 overflow-y-auto pr-4 ${containerClassName ?? 'flex-col border-r'}`}>
      {thumbnails.map((src, idx) => {
        const pageNum = idx + 1;
        return (
          <div key={pageNum} className="flex flex-col items-center gap-1">
            <img
              src={src}
              onClick={() => setCurrentPage(pageNum)}
              className={`cursor-pointer border-2 rounded-md ${
                pageNum === currentPage ? 'border-blue-600' : 'border-transparent'
              } hover:border-blue-400 transition`}
              alt={`Page ${pageNum}`}
            />
            {!limitPages && (
              <div className="text-sm text-gray-600">Page {pageNum}</div>
            )}
            {renderBelow && renderBelow(pageNum)}
          </div>
        );
      })}
    </div>
  );
}
