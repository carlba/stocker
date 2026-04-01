'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Quote, Instrument, ServerMessage, ClientMessage } from '@/types/market';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4001';

export interface UseMarketReturn {
  quotes: Map<string, Quote>;
  searchResults: Instrument[];
  connected: boolean;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  search: (query: string) => void;
}

export function useMarket(): UseMarketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);

  // Pending subscriptions when WS is not yet open
  const pendingRef = useRef<ClientMessage[]>([]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      pendingRef.current.push(msg);
    }
  }, []);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Flush pending messages
        for (const msg of pendingRef.current) {
          ws.send(JSON.stringify(msg));
        }
        pendingRef.current = [];
      };

      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 3 s
        reconnectTimer = setTimeout(connect, 3_000);
      };

      ws.onerror = (e) => {
        console.error('[WS] error', e);
      };

      ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data as string) as ServerMessage;
        switch (msg.type) {
          case 'quote':
            setQuotes((prev) => {
              const next = new Map(prev);
              next.set(msg.data.symbol, msg.data);
              return next;
            });
            break;
          case 'instruments':
            setSearchResults(msg.data);
            break;
          case 'error':
            console.warn(`[WS] Error for ${msg.symbol}: ${msg.message}`);
            break;
        }
      };
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws.onclose = null; // prevent reconnect on intentional close
      ws.close();
    };
  }, []);

  const subscribe = useCallback(
    (symbol: string) => send({ type: 'subscribe', symbol }),
    [send]
  );

  const unsubscribe = useCallback(
    (symbol: string) => send({ type: 'unsubscribe', symbol }),
    [send]
  );

  const search = useCallback(
    (query: string) => send({ type: 'search', query }),
    [send]
  );

  return { quotes, searchResults, connected, subscribe, unsubscribe, search };
}
