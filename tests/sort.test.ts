import { sortTokens } from "../src/utils/tokenListUtils";
import { Token } from "../src/types/token";

const sample: Token[] = [
  {
    token_address: "1",
    token_name: "A",
    token_ticker: "A",
    price_sol: 1,
    market_cap_sol: 10,
    liquidity_sol: 0,
    volume_sol: 200,
    transaction_count: 0,
    price_1h_change: 5,
    price_24h_change: 10,
    price_7d_change: 0,
    protocol: "",
    sources: []
  },
  {
    token_address: "2",
    token_name: "B",
    token_ticker: "B",
    price_sol: 5,
    market_cap_sol: 50,
    liquidity_sol: 0,
    volume_sol: 100,
    transaction_count: 0,
    price_1h_change: 1,
    price_24h_change: 3,
    price_7d_change: 0,
    protocol: "",
    sources: []
  }
];

describe("Sorting", () => {
  test("sort by price descending", () => {
    const out = sortTokens([...sample], "price", "1h");
    expect(out[0].price_sol).toBe(5);
  });

  test("sort by volume descending", () => {
    const out = sortTokens([...sample], "volume", "24h");
    expect(out[0].volume_sol).toBe(200);
  });

  test("sort by price change (1h)", () => {
    const out = sortTokens([...sample], "priceChange", "1h");
    expect(out[0].price_1h_change).toBe(5);
  });
});
