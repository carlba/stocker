# Stocker – Real-time Financial Terminal

A full-stack financial terminal that monitors stocks, funds and market indexes in real-time.

## Architecture

```
stocker/
├── backend/    TypeScript WebSocket backend with plugin-based datasource system
└── frontend/   Next.js frontend with real-time charts (Recharts)
```

### Backend (`backend/`)

Built with TypeScript + Node.js, exposing a **WebSocket** server (port 4001 by default).

#### Plugin system

| Plugin | Exchange / Index | Data source |
|--------|-----------------|-------------|
| `NasdaqPlugin` | Nasdaq (NMS, NGM, NCM) | Yahoo Finance (free) |
| `DowJonesPlugin` | NYSE / Dow Jones (^DJI) | Yahoo Finance (free) |
| `OmxPlugin` | Nasdaq OMX Nordic (.ST, .HE, .CO) | Yahoo Finance (free) |

Each plugin implements the `DataSourcePlugin` interface:

```ts
interface DataSourcePlugin {
  info: PluginInfo;
  canHandle(symbol: string): boolean;
  fetchQuote(symbol: string): Promise<Quote>;
  search(query: string): Promise<Instrument[]>;
}
```

#### WebSocket protocol

**Client → Server (JSON):**
| Message | Description |
|---------|-------------|
| `{ type: 'subscribe', symbol }` | Start receiving quotes for a symbol |
| `{ type: 'unsubscribe', symbol }` | Stop receiving quotes for a symbol |
| `{ type: 'search', query }` | Search for instruments |

**Server → Client (JSON):**
| Message | Description |
|---------|-------------|
| `{ type: 'quote', data: Quote }` | Latest price data |
| `{ type: 'subscribed', symbol }` | Subscription confirmed |
| `{ type: 'unsubscribed', symbol }` | Unsubscription confirmed |
| `{ type: 'instruments', data: [] }` | Search results |
| `{ type: 'error', symbol, message }` | Error fetching a symbol |

#### Running the backend

```bash
cd backend
npm install
npm run dev        # development (tsx watch)
npm run build && npm start  # production
```

Environment variables (`.env`):
```
WS_PORT=4001          # WebSocket port (default: 4001)
POLL_INTERVAL_MS=5000 # Quote poll interval in ms (default: 5000)
```

### Frontend (`frontend/`)

Next.js 16 app with Tailwind CSS and Recharts.

Features:
- Real-time price cards with sparkline charts
- Search instruments (stocks, funds, indexes) by name or ticker
- Add / remove instruments from the watchlist
- Auto-reconnecting WebSocket client
- Defaults: `^IXIC` (Nasdaq), `^DJI` (Dow Jones), `^OMXS30` (OMX Stockholm)

#### Running the frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # configure WS URL if needed
npm run dev     # development on http://localhost:3000
npm run build && npm start   # production
```

## Quick start (both services)

```bash
# Terminal 1 – backend
cd backend && npm install && npm run dev

# Terminal 2 – frontend
cd frontend && npm install && npm run dev
```

Open **http://localhost:3000**.

## Data source

All market data is sourced from **Yahoo Finance** (free, no API key required).
Prices may be delayed up to 15 minutes outside regular market hours.

## Disclaimer

This project uses unofficial Yahoo Finance APIs.
It is not affiliated with or endorsed by Yahoo Inc.
Use at your own risk.

