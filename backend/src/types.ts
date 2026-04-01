/**
 * Shared types for the Stocker financial terminal backend.
 */

export type InstrumentType = 'stock' | 'fund' | 'index';

export interface Instrument {
  symbol: string;
  name: string;
  type: InstrumentType;
  exchange: string;
}

export interface Quote {
  symbol: string;
  name: string;
  type: InstrumentType;
  exchange: string;
  price: number;
  previousClose: number | null;
  change: number;
  changePercent: number;
  volume: number | null;
  marketCap: number | null;
  timestamp: number;
}

export interface PluginInfo {
  id: string;
  name: string;
  description: string;
  exchanges: string[];
}

/** WebSocket message sent from server to client */
export type ServerMessage =
  | { type: 'quote'; data: Quote }
  | { type: 'error'; symbol: string; message: string }
  | { type: 'subscribed'; symbol: string }
  | { type: 'unsubscribed'; symbol: string }
  | { type: 'instruments'; data: Instrument[] };

/** WebSocket message sent from client to server */
export type ClientMessage =
  | { type: 'subscribe'; symbol: string }
  | { type: 'unsubscribe'; symbol: string }
  | { type: 'search'; query: string };
