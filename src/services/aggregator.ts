import { fetchDexScreener } from "../fetchers/dexFetcher";
import { fetchGeckoTerminal } from "../fetchers/geckoFetcher";
import { fetchJupiterPrices } from "../fetchers/jupiterFetcher";
import { mergeTokens } from "../utils/merge";
import { RawToken, Token } from "../types/token";
import { getCache, setCache } from "../cache/cache";

const CACHE_TTL = 30; // seconds

function tokenToRaw(t: Token): RawToken {
    return {
        token_address: t.token_address,
        token_name: t.token_name,
        token_ticker: t.token_ticker,

        price_sol: t.price_sol,
        market_cap_sol: t.market_cap_sol,
        liquidity_sol: t.liquidity_sol,
        volume_sol: t.volume_sol,

        transaction_count: t.transaction_count,

        price_1h_change: t.price_1h_change,
        price_24h_change: t.price_24h_change,
        price_7d_change: t.price_7d_change,

        protocol: t.protocol,
        source: "merged" // placeholder
    };
}

export async function aggregateTokens(query: string): Promise<Token[]> {
    const cacheKey = `tokens:${query || "default"}`;

    // Return cached response if exists
    const cached = getCache<Token[]>(cacheKey);
    if (cached) return cached;

    // Fetch from all datasources simultaneously
    const [dexRaw, geckoRaw] = await Promise.all([
        fetchDexScreener(query),
        fetchGeckoTerminal(query)
    ]);
    if (dexRaw.length === 0 && geckoRaw.length === 0) {
        return []; // nothing matched query
    }

    // Combine all RawTokens
    let allRaw: RawToken[] = [...dexRaw, ...geckoRaw];

    // First merge — this gives us the initial token list
    let tokens = mergeTokens(allRaw);

    // Find tokens that have missing price
    const missingPriceAddresses = tokens
        .filter(t => !t.price_sol || t.price_sol === 0)
        .map(t => t.token_address);

    if (missingPriceAddresses.length > 0) {
        const jupiterRaw = await fetchJupiterPrices(missingPriceAddresses);
        // Merge again with Jupiter price data
        const tokensAsRaw: RawToken[] = tokens.map(t => tokenToRaw(t));
        tokens = mergeTokens([...tokensAsRaw, ...jupiterRaw]);

    }

    // Save to cache
    setCache(cacheKey, tokens, CACHE_TTL);

    // Return final merged tokens
    return tokens;
}
