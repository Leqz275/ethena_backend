import { mergeTokens } from "../src/utils/merge";
import { RawToken } from "../src/types/token";

describe("mergeTokens()", () => {

  test("merges tokens with the same address", () => {
    const a: RawToken = {
      token_address: "A",
      token_name: "Alpha",
      token_ticker: "ALP",
      price_sol: 1,
      market_cap_sol: 100,
      liquidity_sol: 10,
      volume_sol: 50,
      transaction_count: 10,
      price_1h_change: 1,
      price_24h_change: 5,
      price_7d_change: 10,
      protocol: "dex1",
      source: "dexscreener"
    };

    const b: RawToken = {
      token_address: "A",
      token_ticker: "ALP",
      price_sol: 1.2, // <-- different price
      liquidity_sol: 12,
      source: "geckoterminal"
    };

    const merged = mergeTokens([a, b]);

    expect(merged.length).toBe(1);
    const t = merged[0];

    expect(t.token_address).toBe("A");
    expect(t.token_name).toBe("Alpha"); // fallback keeps non-null
    expect(t.price_sol).toBe(1.2);      // latest takes precedence
    expect(t.sources).toContain("dexscreener");
    expect(t.sources).toContain("geckoterminal");
  });

  test("keeps separate tokens when addresses differ", () => {
    const t1: RawToken = {
      token_address: "A", source: "dexscreener"
    };
    const t2: RawToken = {
      token_address: "B", source: "dexscreener"
    };

    const merged = mergeTokens([t1, t2]);
    expect(merged.length).toBe(2);
  });

  test("fills missing numeric fields with 0", () => {
    const t: RawToken = {
      token_address: "A",
      source: "jupiter"
    };

    const merged = mergeTokens([t]);
    const m = merged[0];

    expect(m.price_sol).toBe(0);
    expect(m.market_cap_sol).toBe(0);
    expect(m.liquidity_sol).toBe(0);
    expect(m.volume_sol).toBe(0);
    expect(m.transaction_count).toBe(0);
  });

  test("merges protocol by taking the last non-null value", () => {
    const a: RawToken = {
      token_address: "A",
      protocol: "dex1",
      source: "dexscreener"
    };
    const b: RawToken = {
      token_address: "A",
      protocol: "gt",
      source: "geckoterminal"
    };

    const merged = mergeTokens([a, b]);
    expect(merged[0].protocol).toBe("gt");
  });

});
