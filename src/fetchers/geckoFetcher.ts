import axios from "axios";
import { RawToken } from "../types/token";
import { retry } from "../utils/retry";


const BASE_URL = "https://api.geckoterminal.com/api/v2/networks/solana/tokens";

export async function fetchGeckoTerminal(query?: string): Promise<RawToken[]> {
  return retry(async () => {
    const url = query
      ? `${BASE_URL}?search=${encodeURIComponent(query)}`
      : BASE_URL;

    let res;
    try {
      res = await axios.get(url, { timeout: 10000 });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return [];
      }
      throw err;
    }
    const items = res.data?.data || [];

    const tokens: RawToken[] = items.map((item: any) => {
      const attr = item.attributes || {};

      return {
        token_address: attr.address,
        token_name: attr.name,
        token_ticker: attr.symbol,

        price_sol: Number(attr.price_native ?? 0),
        market_cap_sol: Number(attr.fdv_native ?? 0),
        liquidity_sol: Number(attr.reserve_native ?? 0),
        volume_sol: Number(attr.volume_24h_native ?? 0),

        transaction_count: Number(attr.transactions_24h ?? 0),

        price_1h_change: Number(attr.price_change_percentage_1h ?? 0),
        price_24h_change: Number(attr.price_change_percentage_24h ?? 0),
        price_7d_change: Number(attr.price_change_percentage_7d ?? 0),

        protocol: "geckoterminal",
        source: "geckoterminal"
      };
    });

    return tokens.filter(t => !!t.token_address);
  });
}
