/**
 * DataSource plugin interface.
 * Each plugin handles a specific exchange or market data provider.
 */

import type { Instrument, Quote, PluginInfo } from '../types.js';

export interface DataSourcePlugin {
  /** Metadata about this plugin */
  readonly info: PluginInfo;

  /**
   * Returns true if this plugin can handle the given symbol.
   */
  canHandle(symbol: string): boolean;

  /**
   * Fetch the latest quote for a symbol.
   */
  fetchQuote(symbol: string): Promise<Quote>;

  /**
   * Search for instruments matching the given query.
   */
  search(query: string): Promise<Instrument[]>;
}
