jest.mock("../src/fetchers/dexFetcher");
jest.mock("../src/fetchers/geckoFetcher");
jest.mock("../src/fetchers/jupiterFetcher");

import { aggregateTokens } from "../src/services/aggregator";
import { fetchDexScreener } from "../src/fetchers/dexFetcher";
import { fetchGeckoTerminal } from "../src/fetchers/geckoFetcher";
import { fetchJupiterPrices } from "../src/fetchers/jupiterFetcher";


describe("Aggregator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches from Dex + Gecko and merges", async () => {
    (fetchDexScreener as jest.Mock).mockResolvedValue([
      { token_address: "A", price_sol: 1, source: "dexscreener" }
    ]);

    (fetchGeckoTerminal as jest.Mock).mockResolvedValue([
      { token_address: "A", price_sol: 2, source: "gecko" }
    ]);

    (fetchJupiterPrices as jest.Mock).mockResolvedValue([]);

    const out = await aggregateTokens("bear");

    expect(out.length).toBe(1);
    expect(out[0].price_sol).toBe(2);
  });

  test("fallbacks to Jupiter if missing price", async () => {
    (fetchDexScreener as jest.Mock).mockResolvedValue([
      { token_address: "A", source: "dexscreener" }
    ]);
    (fetchGeckoTerminal as jest.Mock).mockResolvedValue([]);

    (fetchJupiterPrices as jest.Mock).mockResolvedValue([
      { token_address: "A", price_sol: 10, source: "jupiter" }
    ]);

    const out = await aggregateTokens("missing");

    expect(out[0].price_sol).toBe(10);
  });

  test("caches output", async () => {
    (fetchDexScreener as jest.Mock).mockResolvedValue([
      { token_address: "A", price_sol: 5, source: "dexscreener" }
    ]);
    (fetchGeckoTerminal as jest.Mock).mockResolvedValue([]);

    (fetchJupiterPrices as jest.Mock).mockResolvedValue([]);

    await aggregateTokens("cachetest");
    await aggregateTokens("cachetest");

    expect(fetchDexScreener).toHaveBeenCalledTimes(1);
  });
});
