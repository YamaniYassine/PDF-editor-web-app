import React from 'react';

interface PaginationProps {
  currentPage: number;
  numPages: number;
  setCurrentPage: (page: number) => void;
}

export default function Pagination({ currentPage, numPages, setCurrentPage }: PaginationProps) {
  return (
    <div className="flex justify-center items-center space-x-6 mt-6">
      <button
        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      <span className="text-gray-600 font-medium text-lg">
        Page {currentPage} / {numPages}
      </span>

      <button
        onClick={() => setCurrentPage(Math.min(currentPage + 1, numPages))}
        disabled={currentPage === numPages}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
