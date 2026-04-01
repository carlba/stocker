/**
 * WebSocket server for the Stocker financial terminal.
 *
 * Protocol
 * --------
 * Client → Server (JSON):
 *   { type: 'subscribe',   symbol: string }
 *   { type: 'unsubscribe', symbol: string }
 *   { type: 'search',      query:  string }
 *
 * Server → Client (JSON):
 *   { type: 'quote',        data: Quote }
 *   { type: 'error',        symbol: string, message: string }
 *   { type: 'subscribed',   symbol: string }
 *   { type: 'unsubscribed', symbol: string }
 *   { type: 'instruments',  data: Instrument[] }
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { MarketService } from './market-service.js';
import type { Quote, ServerMessage, ClientMessage } from './types.js';

export function createWebSocketServer(
  port: number,
  marketService: MarketService
): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    console.log('[WS] Client connected');

    /** symbol → quote handler (so we can unsubscribe on disconnect) */
    const handlers = new Map<string, (q: Quote) => void>();
    const errorHandlers = new Map<
      string,
      (sym: string, msg: string) => void
    >();

    const send = (msg: ServerMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    };

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        console.warn('[WS] Invalid JSON from client');
        return;
      }

      switch (msg.type) {
        case 'subscribe': {
          const { symbol } = msg;
          if (handlers.has(symbol)) return; // already subscribed

          const onQuote = (q: Quote) => send({ type: 'quote', data: q });
          const onError = (sym: string, message: string) =>
            send({ type: 'error', symbol: sym, message });

          handlers.set(symbol, onQuote);
          errorHandlers.set(symbol, onError);
          marketService.subscribe(symbol, onQuote, onError);
          send({ type: 'subscribed', symbol });
          console.log(`[WS] Subscribed: ${symbol}`);
          break;
        }

        case 'unsubscribe': {
          const { symbol } = msg;
          const onQuote = handlers.get(symbol);
          if (onQuote) {
            marketService.unsubscribe(symbol, onQuote);
            handlers.delete(symbol);
            errorHandlers.delete(symbol);
            send({ type: 'unsubscribed', symbol });
            console.log(`[WS] Unsubscribed: ${symbol}`);
          }
          break;
        }

        case 'search': {
          const { query } = msg;
          marketService
            .search(query)
            .then((instruments) => {
              send({ type: 'instruments', data: instruments });
            })
            .catch((err: unknown) => {
              const message =
                err instanceof Error ? err.message : String(err);
              console.error(`[WS] Search error: ${message}`);
            });
          break;
        }
      }
    });

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
      for (const [symbol, onQuote] of handlers) {
        marketService.unsubscribe(symbol, onQuote);
      }
      handlers.clear();
      errorHandlers.clear();
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err);
    });
  });

  return wss;
}
