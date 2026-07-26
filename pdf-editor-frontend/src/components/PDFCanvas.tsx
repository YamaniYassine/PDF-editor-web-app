'use client';
import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { TextItem } from './types';

interface PDFCanvasProps {
  pdf: PDFDocumentProxy;
  currentPage: number;
  scale: number;
  textItems: TextItem[];
  activeEditIndex: number | null;
  setActiveEditIndex: (i: number | null) => void;
  updateText: (idx: number, text: string) => void;
}

export default function PDFCanvas({
  pdf,
  currentPage,
  scale,
  textItems,
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
      } catch (err: unknown) {
        if (!(err instanceof Error) || err.name !== 'RenderingCancelledException') {
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
  }, [pdf, currentPage, scale]);

  const correctedPage = currentPage - 1;

  return (
    <div
      className="relative shadow-xl border border-gray-300 rounded overflow-hidden bg-white"
      style={{ minHeight: '400px', width: canvasRef.current?.width ?? 'auto', height: canvasRef.current?.height ?? 'auto' }}
    >
      <canvas ref={canvasRef} className="block" />

      {textItems
        .map((item, idx) => ({ ...item, idx }))
        .filter((t) => t.page_number === correctedPage)
        .map(({ idx, ...it }) => {
          const x = it.x * scale;
          const y = it.y * scale;
          const isEditing = activeEditIndex === idx;
          const hasChanged = it.text !== it.original_text;

          return (
            <div
              key={idx}
              onClick={() => setActiveEditIndex(idx)}
              className="absolute"
              style={{
                top: y,
                left: x,
                fontSize: it.font_size * scale,
                minWidth: Math.max(it.width * scale, it.font_size * scale * 2),
                height: Math.max(it.height * scale, it.font_size * scale * 1.25),
                fontWeight: it.is_bold ? 'bold' : 'normal',
                fontStyle: it.is_italic ? 'italic' : 'normal',
                fontFamily: 'Helvetica, sans-serif',
                whiteSpace: 'nowrap',
                userSelect: 'text',
                cursor: isEditing ? 'text' : 'pointer',
                zIndex: isEditing ? 10 : 2,
                border: isEditing ? '2px solid rgb(37 99 235)' : '2px solid transparent',
                borderRadius: 2,
                backgroundColor: hasChanged && !isEditing ? 'white' : 'transparent',
                boxShadow: hasChanged && !isEditing ? '0 0 2px 2px white' : 'none',
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isEditing) {
                  e.currentTarget.style.borderColor = 'rgb(37 99 235)';
                  if (!hasChanged) e.currentTarget.style.backgroundColor = 'rgba(219, 234, 254, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditing) {
                  e.currentTarget.style.borderColor = 'transparent';
                  if (!hasChanged) e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {isEditing && (
                <input
                  autoFocus
                  aria-label="Edit PDF text"
                  value={it.text}
                  onChange={(event) => updateText(idx, event.target.value)}
                  onBlur={() => setActiveEditIndex(null)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                  className="block h-full min-w-full border-0 bg-white px-1 outline-none shadow-lg"
                  style={{
                    font: 'inherit',
                    color: `rgb(${it.color.map((channel) => Math.round(channel * 255)).join(', ')})`,
                    width: Math.max(it.width * scale, it.font_size * scale * 2),
                  }}
                />
              )}
              {!isEditing && hasChanged && (
                <span
                  className="block h-full whitespace-nowrap bg-white px-px"
                  style={{ color: `rgb(${it.color.map((channel) => Math.round(channel * 255)).join(', ')})` }}
                >
                  {it.text}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
}
