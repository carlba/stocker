'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Quote, PricePoint } from '@/types/market';

const MAX_HISTORY = 60;

interface Props {
  quote: Quote;
  onRemove: (symbol: string) => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

export function InstrumentCard({ quote, onRemove }: Props) {
  const [history, setHistory] = useState<PricePoint[]>([]);

  useEffect(() => {
    setHistory((prev) => {
      const point: PricePoint = { time: quote.timestamp, price: quote.price };
      const next = [...prev, point];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, [quote.price, quote.timestamp]);

  const isPositive = quote.change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  const bgColor = isPositive ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950';

  const badgeColors: Record<string, string> = {
    stock: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    fund: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    index: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {quote.symbol}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColors[quote.type] ?? badgeColors.stock}`}
            >
              {quote.type}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
            {quote.name}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {quote.exchange}
          </p>
        </div>
        <button
          onClick={() => onRemove(quote.symbol)}
          aria-label={`Remove ${quote.symbol}`}
          className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Price */}
      <div className={`rounded-xl p-3 ${bgColor}`}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">
            {formatPrice(quote.price)}
          </span>
          <span
            className="text-sm font-medium"
            style={{ color }}
          >
            {isPositive ? '+' : ''}
            {formatPrice(quote.change)} ({isPositive ? '+' : ''}
            {quote.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Mini chart */}
      {history.length > 1 && (
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`grad-${quote.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    return (
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow">
                        {formatPrice(payload[0].value as number)}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${quote.symbol})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {quote.previousClose !== null && (
          <>
            <span className="font-medium text-gray-400 dark:text-gray-500">Prev. Close</span>
            <span className="text-right">{formatPrice(quote.previousClose)}</span>
          </>
        )}
        {quote.volume !== null && (
          <>
            <span className="font-medium text-gray-400 dark:text-gray-500">Volume</span>
            <span className="text-right">{formatLargeNumber(quote.volume)}</span>
          </>
        )}
        {quote.marketCap !== null && (
          <>
            <span className="font-medium text-gray-400 dark:text-gray-500">Mkt Cap</span>
            <span className="text-right">{formatLargeNumber(quote.marketCap)}</span>
          </>
        )}
        <span className="font-medium text-gray-400 dark:text-gray-500">Updated</span>
        <span className="text-right">
          {new Date(quote.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
