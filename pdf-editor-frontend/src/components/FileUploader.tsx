'use client';
import React, { useState } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File | File[]) => void;
  multiple?: boolean;
}

export default function FileUploader({ onFileSelect, multiple = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    document.getElementById('fileInput')?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length) {
      onFileSelect(multiple ? files : files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full max-w-xl h-64 border-4 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-sm transition
        ${isDragging ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-600 hover:bg-green-50'}`}
    >
      <div className="text-5xl mb-2">+</div>
      <p className="text-lg font-medium text-center px-2">
        {multiple ? 'Drop PDF files here or click to upload' : 'Drop a PDF file here or click to upload'}
      </p>

      <input
        id="fileInput"
        type="file"
        accept="application/pdf"
        multiple={multiple}
        onChange={(e) => {
          const inputFiles = e.target.files;
          if (inputFiles) {
            onFileSelect(multiple ? Array.from(inputFiles) : inputFiles[0]);
          }
        }}
        className="hidden"
      />
    </div>
  );
}
