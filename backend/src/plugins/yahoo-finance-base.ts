/**
 * Base Yahoo Finance plugin.
 * Concrete exchange plugins extend this class, supplying which symbols /
 * exchanges they are responsible for.
 *
 * - Quotes are fetched via the yahoo-finance2 package.
 * - Search uses the Yahoo Finance public REST API (no key required).
 */

import YahooFinance from 'yahoo-finance2';
import type { DataSourcePlugin } from './base.js';
import type { Instrument, InstrumentType, Quote, PluginInfo } from '../types.js';

interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
}

const yf = new YahooFinance();

export abstract class YahooFinancePlugin implements DataSourcePlugin {
  abstract readonly info: PluginInfo;

  canHandle(symbol: string): boolean {
    return this.ownedSymbolPrefixOrSuffix(symbol);
  }

  protected abstract ownedSymbolPrefixOrSuffix(symbol: string): boolean;

  async fetchQuote(symbol: string): Promise<Quote> {
    const result = await yf.quote(symbol);
    const type = this.resolveType(result.quoteType ?? 'EQUITY');
    return {
      symbol: result.symbol,
      name: result.shortName ?? result.longName ?? result.symbol,
      type,
      exchange: result.fullExchangeName ?? result.exchange ?? '',
      price: result.regularMarketPrice ?? 0,
      previousClose: result.regularMarketPreviousClose ?? null,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      volume: result.regularMarketVolume ?? null,
      marketCap: result.marketCap ?? null,
      timestamp: Date.now(),
    };
  }

  async search(query: string): Promise<Instrument[]> {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(query)}&lang=en-US&region=US` +
      `&quotesCount=20&newsCount=0&enableFuzzyQuery=false` +
      `&enableNavLinks=false&enableEnhancedTrivialQuery=false`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance search failed: ${response.status}`);
    }

    const data = (await response.json()) as { finance?: YahooSearchResponse };
    const quotes = data.finance?.quotes ?? [];

    return quotes
      .filter((q) => q.symbol && this.canHandle(q.symbol))
      .map((q) => ({
        symbol: q.symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        type: this.resolveType(q.quoteType ?? 'EQUITY'),
        exchange: q.exchange ?? '',
      }));
  }

  protected resolveType(quoteType: string): InstrumentType {
    switch (quoteType.toUpperCase()) {
      case 'ETF':
      case 'MUTUALFUND':
        return 'fund';
      case 'INDEX':
        return 'index';
      default:
        return 'stock';
    }
  }
}
