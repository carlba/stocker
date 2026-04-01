/**
 * Nasdaq plugin.
 * Handles US Nasdaq-listed stocks, ETFs, and the ^IXIC index.
 * Symbols traded on Nasdaq typically have no exchange suffix in Yahoo Finance
 * (e.g. AAPL, MSFT, ^IXIC).
 */

import { YahooFinancePlugin } from './yahoo-finance-base.js';
import type { PluginInfo } from '../types.js';

/** Nasdaq-exchange suffixes used by Yahoo Finance */
const NASDAQ_EXCHANGES = new Set(['NMS', 'NGM', 'NCM', 'NASDAQ']);

/** Well-known Nasdaq index symbols */
const NASDAQ_INDEXES = new Set(['^IXIC', '^NDX', '^NDAQ']);

export class NasdaqPlugin extends YahooFinancePlugin {
  readonly info: PluginInfo = {
    id: 'nasdaq',
    name: 'Nasdaq',
    description: 'Nasdaq-listed stocks, ETFs and indexes',
    exchanges: ['NMS', 'NGM', 'NCM', 'NASDAQ'],
  };

  protected ownedSymbolPrefixOrSuffix(symbol: string): boolean {
    if (NASDAQ_INDEXES.has(symbol.toUpperCase())) return true;
    const upper = symbol.toUpperCase();
    // Yahoo Finance uses no suffix for most Nasdaq stocks; no dots or dashes
    // that indicate foreign exchange.  We accept plain US tickers and the
    // Nasdaq indexes.
    if (/^[A-Z]{1,5}$/.test(upper)) return true;
    // Also accept if the internal exchange field is set (handled at search time)
    return NASDAQ_EXCHANGES.has(upper);
  }
}
