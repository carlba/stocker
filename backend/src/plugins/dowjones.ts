/**
 * Dow Jones plugin.
 * Handles the Dow Jones Industrial Average index (^DJI) and NYSE-listed stocks.
 * NYSE stocks traded on the "NYQ" exchange in Yahoo Finance.
 */

import { YahooFinancePlugin } from './yahoo-finance-base.js';
import type { PluginInfo } from '../types.js';

const DOW_INDEXES = new Set(['^DJI', '^DJT', '^DJU', '^DJUSIND']);
const NYSE_EXCHANGES = new Set(['NYQ', 'NYSE', 'PCX', 'ASE']);

export class DowJonesPlugin extends YahooFinancePlugin {
  readonly info: PluginInfo = {
    id: 'dowjones',
    name: 'Dow Jones / NYSE',
    description: 'Dow Jones indexes and NYSE-listed stocks',
    exchanges: ['NYQ', 'NYSE'],
  };

  protected ownedSymbolPrefixOrSuffix(symbol: string): boolean {
    if (DOW_INDEXES.has(symbol.toUpperCase())) return true;
    // NYSE stocks typically have a suffix like .N in some systems; in Yahoo
    // Finance they are plain tickers (same as Nasdaq).  We accept them via
    // the exchange whitelist during search, and also accept ^DJI directly.
    return NYSE_EXCHANGES.has(symbol.toUpperCase());
  }
}
