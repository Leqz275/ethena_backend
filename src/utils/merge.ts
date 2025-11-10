import { RawToken, Token } from "../types/token.js";

// Pick logic
function pick<T>(newVal: T | undefined, oldVal: T, fallback: T): T {
  if (newVal !== undefined && newVal !== null) return newVal;
  if (oldVal !== undefined && oldVal !== null) return oldVal;
  return fallback;
}

export function mergeTokens(rawTokens: RawToken[]): Token[] {
  // The 'map' is the "accumulator" in the reduce function
  const finalMap = rawTokens.reduce((map, t) => {
    if (!t.token_address) {
      return map; // Skip this token and continue
    }

    const addr = t.token_address.trim();
    const existing = map.get(addr);

    if (!existing) {
      // Create a fresh Token and set it
      map.set(addr, {
        token_address: addr,
        token_name: t.token_name ?? "", 
        token_ticker: t.token_ticker ?? "", 

        price_sol: t.price_sol ?? 0, 
        market_cap_sol: t.market_cap_sol ?? 0, 
        liquidity_sol: t.liquidity_sol ?? 0, 
        volume_sol: t.volume_sol ?? 0, 
        transaction_count: t.transaction_count ?? 0, 
        price_1h_change: t.price_1h_change ?? 0, 
        price_24h_change: t.price_24h_change ?? 0, 
        price_7d_change: t.price_7d_change ?? 0, 
        protocol: t.protocol ?? "", 

        sources: [t.source]
      });
    } else {
      existing.token_name = pick(t.token_name, existing.token_name, "");
      existing.token_ticker = pick(t.token_ticker, existing.token_ticker, "");

      existing.price_sol = pick(t.price_sol, existing.price_sol, 0);
      existing.market_cap_sol = pick(
        t.market_cap_sol,
        existing.market_cap_sol,
        0
      );
      existing.liquidity_sol = pick(
        t.liquidity_sol,
        existing.liquidity_sol,
        0
      );
      existing.volume_sol = pick(t.volume_sol, existing.volume_sol, 0);

      existing.transaction_count = pick(
        t.transaction_count,
        existing.transaction_count,
        0
      );

      existing.price_1h_change = pick(
        t.price_1h_change,
        existing.price_1h_change,
        0
      );
      existing.price_24h_change = pick(
        t.price_24h_change,
        existing.price_24h_change,
        0
      );
      existing.price_7d_change = pick(
        t.price_7d_change,
        existing.price_7d_change,
        0
      );

      existing.protocol = pick(t.protocol, existing.protocol, "");

      if (!existing.sources.includes(t.source)) {
        existing.sources.push(t.source);
      }
    }
    
    return map;
    
  }, new Map<string, Token>()); //Starting off with an empty Map

  return Array.from(finalMap.values());
}