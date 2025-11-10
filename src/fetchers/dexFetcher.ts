import axios from "axios";
import { RawToken } from "../types/token";
import { retry } from "../utils/retry";


const BASE_URL = "https://api.dexscreener.com/latest/dex";

export async function fetchDexScreener(query: string): Promise<RawToken[]> {
  return retry(async () => {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
    let res;
    try {
      res = await axios.get(url, { timeout: 10000 });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return []; // Return nothing for 404 errors
      }
      throw err;
    }
    const pairs = res.data?.pairs || [];

    const tokens: RawToken[] = pairs.map((p: any) => {
      const base = p.baseToken || {};
      const price = Number(p.priceNative ?? 0);

      return {
        token_address: base.address,
        token_name: base.name,
        token_ticker: base.symbol,

        price_sol: price,
        market_cap_sol: Number(p.fdv ?? p.marketCap ?? 0),
        liquidity_sol: Number((p.liquidity?.base ?? 0)) + Number((p.liquidity?.quote ?? 0)),
        volume_sol: Number(p.volume?.h24 ?? 0),

        transaction_count:
          Number(p.txns?.h24?.buys ?? 0) + Number(p.txns?.h24?.sells ?? 0),

        price_1h_change: Number(p.priceChange?.h1 ?? 0),
        price_24h_change: Number(p.priceChange?.h24 ?? 0),
        price_7d_change: 0, // DexScreener does not provide 7d

        protocol: p.dexId,
        source: "dexscreener"
      };
    });

    return tokens.filter(t => !!t.token_address);
  });
}
