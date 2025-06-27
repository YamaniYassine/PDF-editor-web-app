import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-300 py-6">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-gray-600 text-sm">
        <div className="mb-4 sm:mb-0">
          &copy; {new Date().getFullYear()} Free PDF Editor. All rights reserved.
        </div>

        <nav className="flex space-x-6">
          <Link href="/edit" className="hover:text-gray-800 transition">Edit</Link>
          <Link href="/merge" className="hover:text-gray-800 transition">Merge</Link>
          <Link href="/delete" className="hover:text-gray-800 transition">Delete Pages</Link>
          <Link href="/compress" className="hover:text-gray-800 transition">Compress</Link>
        </nav>
      </div>
    </footer>
  );
}
