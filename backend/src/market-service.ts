/**
 * Market service.
 * Manages symbol subscriptions and polls data from the plugin registry.
 */

import type { PluginRegistry } from './plugins/registry.js';
import type { Quote } from './types.js';

type QuoteHandler = (quote: Quote) => void;
type ErrorHandler = (symbol: string, message: string) => void;

export class MarketService {
  /** symbol → set of subscriber callbacks */
  private readonly subscribers = new Map<string, Set<QuoteHandler>>();
  private readonly errorHandlers = new Map<string, Set<ErrorHandler>>();
  /** symbol → timer handle */
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly registry: PluginRegistry,
    /** Poll interval in milliseconds (default: 5 s) */
    private readonly pollInterval = 5_000
  ) {}

  subscribe(
    symbol: string,
    onQuote: QuoteHandler,
    onError: ErrorHandler
  ): void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.errorHandlers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(onQuote);
    this.errorHandlers.get(symbol)!.add(onError);

    // Start polling if not already running for this symbol
    if (!this.timers.has(symbol)) {
      this.startPolling(symbol);
    }
  }

  unsubscribe(symbol: string, onQuote: QuoteHandler): void {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.delete(onQuote);
      if (subs.size === 0) {
        this.stopPolling(symbol);
        this.subscribers.delete(symbol);
        this.errorHandlers.delete(symbol);
      }
    }
  }

  private startPolling(symbol: string): void {
    // Fetch immediately on first subscription
    void this.poll(symbol);
    const timer = setInterval(() => void this.poll(symbol), this.pollInterval);
    this.timers.set(symbol, timer);
  }

  private stopPolling(symbol: string): void {
    const timer = this.timers.get(symbol);
    if (timer !== undefined) {
      clearInterval(timer);
      this.timers.delete(symbol);
    }
  }

  private async poll(symbol: string): Promise<void> {
    try {
      const quote = await this.registry.fetchQuote(symbol);
      const subs = this.subscribers.get(symbol);
      subs?.forEach((cb) => cb(quote));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const errorSubs = this.errorHandlers.get(symbol);
      errorSubs?.forEach((cb) => cb(symbol, message));
    }
  }

  async search(query: string) {
    return this.registry.search(query);
  }

  dispose(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.subscribers.clear();
    this.errorHandlers.clear();
  }
}
