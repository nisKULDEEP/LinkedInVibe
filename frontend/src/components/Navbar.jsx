import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import icon from '../assets/icon.png';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src={icon} alt="LinkedInVibe Logo" className="h-8 w-8 rounded-lg shadow-sm" />
          <Link to="/" className="text-xl font-bold text-gray-900 tracking-tight">LinkedInVibe</Link>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com/nisKULDEEP/LinkedInVibe" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
          <Link to="/dashboard" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
            Go to App
          </Link>
        </div>
      </div>
    </nav>
  );
}
