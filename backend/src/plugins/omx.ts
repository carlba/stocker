/**
 * OMX (Nordic) plugin.
 * Handles stocks and indexes from the Nasdaq OMX Nordic exchanges
 * (Stockholm, Helsinki, Copenhagen, etc.).
 * Yahoo Finance uses the ".ST", ".HE", ".CO" suffixes.
 */

import { YahooFinancePlugin } from './yahoo-finance-base.js';
import type { PluginInfo } from '../types.js';

/** Yahoo Finance suffix → exchange display name */
const OMX_SUFFIXES: Record<string, string> = {
  '.ST': 'Stockholm',
  '.HE': 'Helsinki',
  '.CO': 'Copenhagen',
  '.IC': 'Iceland',
};

const OMX_INDEXES = new Set(['^OMX', '^OMXS30', '^OMXHPI', '^OMXC25', '^OMXN40']);

export class OmxPlugin extends YahooFinancePlugin {
  readonly info: PluginInfo = {
    id: 'omx',
    name: 'Nasdaq OMX Nordic',
    description: 'Nordic stocks and indexes (Stockholm, Helsinki, Copenhagen)',
    exchanges: Object.values(OMX_SUFFIXES),
  };

  protected ownedSymbolPrefixOrSuffix(symbol: string): boolean {
    if (OMX_INDEXES.has(symbol.toUpperCase())) return true;
    const upper = symbol.toUpperCase();
    return Object.keys(OMX_SUFFIXES).some((suffix) =>
      upper.endsWith(suffix.toUpperCase())
    );
  }
}
