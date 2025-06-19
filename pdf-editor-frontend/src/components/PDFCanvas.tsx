'use client';
import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { TextItem } from './types';

interface PDFCanvasProps {
  pdf: PDFDocumentProxy;
  currentPage: number;
  scale: number;
  textItems: TextItem[];
  pageHeight: number;
  setPageHeight: (h: number) => void;
  activeEditIndex: number | null;
  setActiveEditIndex: (i: number | null) => void;
  updateText: (idx: number, text: string) => void;
}

export default function PDFCanvas({
  pdf,
  currentPage,
  scale,
  textItems,
  pageHeight,
  setPageHeight,
  activeEditIndex,
  setActiveEditIndex,
  updateText,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    if (!pdf) return;

    let canceled = false;

    (async () => {
      const page = await pdf.getPage(currentPage);

      // Cancel previous render if any
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const viewport = page.getViewport({ scale });
      setPageHeight(viewport.height);

      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d')!;
      const renderContext = { canvasContext: ctx, viewport };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
        if (canceled) return;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', err);
        }
      } finally {
        renderTaskRef.current = null;
      }
    })();

    return () => {
      canceled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, currentPage, scale, setPageHeight]);

  const correctedPage = currentPage - 1;

  return (
    <div
      className="relative shadow-xl border border-gray-300 rounded overflow-hidden bg-white"
      style={{ width: canvasRef.current?.width ?? 'auto', height: canvasRef.current?.height ?? 'auto' }}
    >
      <canvas ref={canvasRef} className="block" />

      {textItems
        .map((item, idx) => ({ ...item, idx }))
        .filter((t) => t.page_number === correctedPage)
        .map(({ idx, ...it }) => {
          const x = it.x * scale;
          const y = pageHeight - it.y * scale - it.font_size * scale * 1.3;
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
                opacity: isEditing ? 1 : 0,
                backgroundColor: isEditing ? 'white' : 'transparent',
                zIndex: isEditing ? 10 : 2,
                transition: 'opacity 0.15s',
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
  );
}
