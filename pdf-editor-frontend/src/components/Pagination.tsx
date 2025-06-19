import React from 'react';

interface PaginationProps {
  currentPage: number;
  numPages: number;
  setCurrentPage: (page: number) => void;
}

export default function Pagination({ currentPage, numPages, setCurrentPage }: PaginationProps) {
  return (
    <div className="flex justify-center space-x-4 mt-4">
      <button
        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      >
        Prev
      </button>
      <span className="px-3 py-1">
        Page {currentPage} / {numPages}
      </span>
      <button
        onClick={() => setCurrentPage(Math.min(currentPage + 1, numPages))}
        disabled={currentPage === numPages}
        className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
