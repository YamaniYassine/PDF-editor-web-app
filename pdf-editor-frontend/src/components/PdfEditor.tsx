'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist/webpack.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface TextItem {
  text: string;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scale = 1.5;

  // 1️⃣ Upload & extract
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pdf = e.target.files?.[0] ?? null;
    if (!pdf) return;
    setFile(pdf);
    const form = new FormData();
    form.append('file', pdf);
    const resp = await axios.post('http://localhost:8000/api/extract', form);
    setTextItems(resp.data.items);
  };

  // 2️⃣ Render PDF & get page height
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

  // 3️⃣ Edit & save
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
    <div className="p-4 space-y-4" style={{ position: 'relative' }}>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <div className="relative" style={{ position: 'relative', width: 'fit-content' }}>
        <canvas ref={canvasRef} className="border" />
        {textItems.map((it, i) => {
          // Correct coordinate calculation
          const offsetY = it.font_size * scale * 1.3; // fine-tune baseline difference
          const x = it.x * scale;
          const y = pageHeight - (it.y * scale) - offsetY;

          // Debug log to verify positions
          console.log(
            `Text[${i}] "${it.text}" → original x:${it.x}, y:${it.y} → scaled x:${x}, y:${y}`
          );

          return (
            <div
              key={i}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => updateText(i, e.currentTarget.textContent || '')}
              className="absolute bg-white bg-opacity-70 px-1"
              style={{
                top: y,
                left: x,
                fontSize: it.font_size * scale,
                width: it.width,
                fontWeight: it.is_bold ? 'bold' : 'normal',
                fontStyle: it.is_italic ? 'italic' : 'normal',
                fontFamily: 'Helvetica, sans-serif', 
                whiteSpace: 'nowrap',
                cursor: 'text',
                userSelect: 'text',
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
