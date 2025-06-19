import React from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  return (
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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
        className="hidden"
      />
    </div>
  );
}