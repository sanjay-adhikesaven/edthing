'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchIcon, XIcon } from '@heroicons/react/outline';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search posts, titles, content, or attachments..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'transform scale-[1.01]' : ''
      }`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className={`h-5 w-5 transition-colors ${
            isFocused ? 'text-gray-700' : 'text-gray-400'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="input-search pl-12 pr-32 py-4 text-base w-full"
        />

        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          
          <button
            type="submit"
            className="btn btn-primary text-sm px-4 py-2"
          >
            Search
          </button>

          {!isFocused && !query && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500 pointer-events-none">
              <span>/</span>
            </div>
          )}
        </div>
      </div>

      {isFocused && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4 animate-fade-in">
          <span>Try searching by student name, homework number (HW3), or topic (Muon, SOAP).</span>
        </div>
      )}
    </form>
  );
}
