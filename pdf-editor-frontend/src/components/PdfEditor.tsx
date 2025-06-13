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
}


export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scale = 1.5;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pdf = e.target.files?.[0] ?? null;
    if (!pdf) return;
    setFile(pdf);
    const form = new FormData();
    form.append('file', pdf);
    const resp = await axios.post('http://localhost:8000/api/extract', form);
    setTextItems(resp.data.items);
  };

  useEffect(() => {
    if (!file) return;
    (async () => {
      const data = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });
      setPageHeight(viewport.height);
      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    })();
  }, [file]);

  const handleSave = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('edits', JSON.stringify(textItems));
    const resp = await axios.post('http://localhost:8000/api/replace', form, { responseType: 'blob' });
    saveAs(resp.data, 'edited.pdf');
  };

  const updateText = (idx: number, newText: string) => {
    setTextItems(prev => {
      const arr = [...prev];
      arr[idx].text = newText;
      return arr;
    });
  };

  return (
    <div className="p-4 space-y-4 relative">
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <div className="relative" style={{ width: 'fit-content' }}>
        <canvas ref={canvasRef} className="border" />
        {textItems.map((it, i) => {
          const offsetY = it.font_size * scale * 1.3;
          const x = it.x * scale;
          const y = pageHeight - (it.y * scale) - offsetY;
          const isEditing = activeEditIndex === i;

          return (
            <div
              key={i}
              suppressContentEditableWarning
              contentEditable={isEditing}
              onClick={() => setActiveEditIndex(i)}
              onBlur={(e) => {
                updateText(i, e.currentTarget.textContent || '');
                setActiveEditIndex(null);
              }}
              className={`absolute transition-all duration-150`}
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
                padding: isEditing ? '2px 4px' : 0,
                pointerEvents: 'auto',
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
      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
        Save PDF
      </button>
    </div>
  );
}
