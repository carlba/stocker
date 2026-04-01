/**
 * Stocker backend – entry point.
 *
 * Wires together:
 *  - Plugin registry (Nasdaq, Dow Jones, OMX)
 *  - Market service (polling + subscriptions)
 *  - WebSocket server (client connections)
 */

import { PluginRegistry } from './plugins/registry.js';
import { NasdaqPlugin } from './plugins/nasdaq.js';
import { DowJonesPlugin } from './plugins/dowjones.js';
import { OmxPlugin } from './plugins/omx.js';
import { MarketService } from './market-service.js';
import { createWebSocketServer } from './websocket-server.js';

const WS_PORT = Number(process.env['WS_PORT'] ?? 4001);
const POLL_INTERVAL = Number(process.env['POLL_INTERVAL_MS'] ?? 5_000);

// Register plugins
const registry = new PluginRegistry();
registry.register(new NasdaqPlugin());
registry.register(new DowJonesPlugin());
registry.register(new OmxPlugin());

// Create market service
const marketService = new MarketService(registry, POLL_INTERVAL);

// Start WebSocket server
const wss = createWebSocketServer(WS_PORT, marketService);

console.log(`[Stocker] WebSocket server listening on ws://localhost:${WS_PORT}`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Stocker] Shutting down...');
  marketService.dispose();
  wss.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  marketService.dispose();
  wss.close(() => process.exit(0));
});
