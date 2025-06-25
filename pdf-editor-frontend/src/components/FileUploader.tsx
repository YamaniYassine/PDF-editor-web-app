import React from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File | File[]) => void;
  multiple?: boolean;
}

export default function FileUploader({ onFileSelect, multiple = false }: FileUploaderProps) {
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
