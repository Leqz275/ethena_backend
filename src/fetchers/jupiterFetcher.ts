import axios from "axios";
import { RawToken } from "../types/token";
import { retry } from "../utils/retry";


const BASE_URL = "https://price.jup.ag/v4/price";

export async function fetchJupiterPrices(addresses: string[]): Promise<RawToken[]> {
  if (addresses.length === 0) return [];

  return retry(async () => {
    const unique = Array.from(new Set(addresses));
    const url = `${BASE_URL}?ids=${unique.join(",")}`;

    let res;
    try {
      res = await axios.get(url, { timeout: 10000 });
    } catch (err: any) {
      if (err.response?.status === 404) {
        return []; 
      }
      throw err;
    }
    const priceMap = res.data?.data || {};

    const tokens: RawToken[] = Object.entries(priceMap).map(([addr, data]: any) => ({
      token_address: addr,
      price_sol: Number(data.price ?? 0), 
      source: "jupiter"
    }));

    return tokens;
  });
}
