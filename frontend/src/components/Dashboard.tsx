'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMarket } from '@/hooks/useMarket';
import { InstrumentCard } from './InstrumentCard';
import { AddInstrument } from './AddInstrument';

/** Default instruments to show on load */
const DEFAULT_SYMBOLS = ['^IXIC', '^DJI', '^OMXS30'];

export function Dashboard() {
  const { quotes, searchResults, connected, subscribe, unsubscribe, search } =
    useMarket();

  const [subscribed, setSubscribed] = useState<string[]>(DEFAULT_SYMBOLS);

  // Subscribe to defaults on mount
  useEffect(() => {
    DEFAULT_SYMBOLS.forEach(subscribe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = useCallback(
    (symbol: string) => {
      if (subscribed.includes(symbol)) return;
      subscribe(symbol);
      setSubscribed((prev) => [...prev, symbol]);
    },
    [subscribed, subscribe]
  );

  const handleRemove = useCallback(
    (symbol: string) => {
      unsubscribe(symbol);
      setSubscribed((prev) => prev.filter((s) => s !== symbol));
    },
    [unsubscribe]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <h1 className="text-xl font-bold tracking-tight">Stocker</h1>
            <span className="hidden sm:block text-sm text-gray-400">
              Financial Terminal
            </span>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="hidden sm:block text-gray-500 dark:text-gray-400">
              {connected ? 'Live' : 'Connecting…'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Search / Add */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Add Instrument
          </h2>
          <AddInstrument
            searchResults={searchResults}
            onSearch={search}
            onAdd={handleAdd}
            subscribedSymbols={new Set(subscribed)}
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Search for stocks, ETFs / funds, or market indexes by name or ticker.
          </p>
        </section>

        {/* Grid */}
        {subscribed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 gap-4">
            <span className="text-5xl">🔍</span>
            <p className="text-lg font-medium">No instruments added yet.</p>
            <p className="text-sm">Search for a ticker above to get started.</p>
          </div>
        ) : (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Watchlist ({subscribed.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subscribed.map((symbol) => {
                const quote = quotes.get(symbol);
                if (!quote) {
                  return (
                    <div
                      key={symbol}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-100 dark:border-gray-700 animate-pulse"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-3 w-36 bg-gray-100 dark:bg-gray-700 rounded" />
                        </div>
                        <button
                          onClick={() => handleRemove(symbol)}
                          aria-label={`Remove ${symbol}`}
                          className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                      <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded" />
                      <p className="text-xs text-center text-gray-400">
                        Loading {symbol}…
                      </p>
                    </div>
                  );
                }
                return (
                  <InstrumentCard
                    key={symbol}
                    quote={quote}
                    onRemove={handleRemove}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-gray-400 dark:text-gray-600">
        Data provided by Yahoo Finance · Prices delayed ~15 min outside market hours
      </footer>
    </div>
  );
}
