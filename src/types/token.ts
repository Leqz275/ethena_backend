export type TimeWindow = "1h" | "24h" | "7d";

// RawToken Data coming from DexScreener, GeckoTerminal, Jupiter APIs
export interface RawToken {
  token_address: string;

  token_name?: string;
  token_ticker?: string;

  price_sol?: number;
  market_cap_sol?: number;
  liquidity_sol?: number;
  volume_sol?: number;

  transaction_count?: number;

  price_1h_change?: number;
  price_24h_change?: number;
  price_7d_change?: number;

  protocol?: string;

  source: "dexscreener" | "geckoterminal" | "jupiter" | string;
}

// Final fully normalized token structure after merging RawTokens from all the API sources
export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;

  price_sol: number;
  market_cap_sol: number;
  liquidity_sol: number;
  volume_sol: number;

  transaction_count: number;

  price_1h_change: number;
  price_24h_change: number;
  price_7d_change: number;

  protocol: string;
  sources: string[];
}

// Query parameters for GET /tokens
export interface ListQuery {
  q?: string;
  window?: TimeWindow;
  sort?: "volume" | "priceChange" | "marketCap" | "price";
  limit?: number;
  cursor?: string;
}

export interface ListResponse {
  items: Token[];
  nextCursor?: string;
}

// WebSocket update payloads
export interface TokenUpdate {
  token: Token;
  prev?: Token;
  type: "price" | "volume" | "spike";
  delta: number; // percentage or multiplier
}
