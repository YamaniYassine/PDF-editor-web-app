'use client';
import Link from 'next/link';
import { FiLink, FiScissors } from 'react-icons/fi';
import { MdOutlineCompress, MdEdit } from 'react-icons/md';

interface ToolGridProps {
  currentTool?: 'edit' | 'merge' | 'delete' | 'compress';
}

export default function ToolGrid({ currentTool }: ToolGridProps) {
  const tools = [
    { key: 'edit', label: 'Edit PDF', href: '/edit', icon: <MdEdit size={36} /> },
    { key: 'merge', label: 'Merge PDFs', href: '/merge', icon: <FiLink size={36} /> },
    { key: 'delete', label: 'Delete Pages', href: '/delete', icon: <FiScissors size={36} /> },
    { key: 'compress', label: 'Compress PDF', href: '/compress', icon: <MdOutlineCompress size={36} /> },
  ];

  return (
    <div className="mt-6 w-full max-w-4xl flex flex-col items-center">
      <h2 className="text-3xl font-semibold text-gray-800 mb-4">Or try other <span className="highlight-pdf">PDF</span> Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full px-4">
        {tools
          .filter((tool) => tool.key !== currentTool)
          .map(({ key, label, href, icon }) => (
            <Link
              key={key}
              href={href}
              className="flex flex-col items-center justify-center px-6 py-8 bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg hover:bg-green-50 transition text-center"
            >
              <div className="mb-3 text-green-600">{icon}</div>
              <span className="text-lg font-medium text-gray-700">{label}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
