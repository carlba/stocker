/**
 * Plugin registry – manages all registered DataSource plugins.
 * Plugins are tried in registration order; the first that can handle
 * a symbol wins.
 */

import type { DataSourcePlugin } from './base.js';
import type { Quote, Instrument } from '../types.js';

export class PluginRegistry {
  private readonly plugins: DataSourcePlugin[] = [];

  register(plugin: DataSourcePlugin): void {
    this.plugins.push(plugin);
    console.log(`[PluginRegistry] Registered plugin: ${plugin.info.name}`);
  }

  getPlugins(): DataSourcePlugin[] {
    return [...this.plugins];
  }

  private findPlugin(symbol: string): DataSourcePlugin | undefined {
    return this.plugins.find((p) => p.canHandle(symbol));
  }

  async fetchQuote(symbol: string): Promise<Quote> {
    const plugin = this.findPlugin(symbol);
    if (!plugin) {
      throw new Error(`No plugin found for symbol: ${symbol}`);
    }
    return plugin.fetchQuote(symbol);
  }

  async search(query: string): Promise<Instrument[]> {
    const results = await Promise.all(
      this.plugins.map((p) =>
        p.search(query).catch((err: unknown) => {
          console.warn(
            `[PluginRegistry] Search error in ${p.info.name}:`,
            err
          );
          return [] as Instrument[];
        })
      )
    );
    return results.flat();
  }
}
