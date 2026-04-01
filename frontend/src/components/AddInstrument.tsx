'use client';

import { useState, useEffect, useRef } from 'react';
import type { Instrument } from '@/types/market';

interface Props {
  searchResults: Instrument[];
  onSearch: (query: string) => void;
  onAdd: (symbol: string) => void;
  subscribedSymbols: Set<string>;
}

export function AddInstrument({
  searchResults,
  onSearch,
  onAdd,
  subscribedSymbols,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(query.trim());
      setOpen(true);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  function handleAdd(symbol: string) {
    onAdd(symbol);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  const badgeColors: Record<string, string> = {
    stock: 'bg-blue-100 text-blue-700',
    fund: 'bg-purple-100 text-purple-700',
    index: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <svg
          className="w-4 h-4 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1 0 4.5 4.5a7.5 7.5 0 0 0 12.15 12.15z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stocks, funds, indexes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onFocus={() => {
            if (searchResults.length > 0 && query.trim().length > 0)
              setOpen(true);
          }}
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {open && searchResults.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {searchResults.map((inst) => {
            const already = subscribedSymbols.has(inst.symbol);
            return (
              <li key={inst.symbol}>
                <button
                  disabled={already}
                  onClick={() => handleAdd(inst.symbol)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors
                    ${already
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                      : 'hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer'
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {inst.symbol}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[220px]">
                      {inst.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColors[inst.type] ?? badgeColors.stock}`}
                    >
                      {inst.type}
                    </span>
                    {already ? (
                      <span className="text-green-500 text-xs">Added</span>
                    ) : (
                      <span className="text-blue-500 text-xs font-medium">+ Add</span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
