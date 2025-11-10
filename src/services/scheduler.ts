import { aggregateTokens } from "./aggregator";
import type { Server as IOServer } from "socket.io";
import type { Token } from "../types/token";
import { getCache, setCache } from "../cache/cache";

const REDIS_SNAPSHOT_KEY = "scheduler:last_snapshot";

export interface SchedulerOpts {
  intervalMs?: number; // default 10s
  query?: string; // default "sol" or your UI query
}

export function startScheduler(io: IOServer, opts: SchedulerOpts = {}) {
  const tickIntervalMs = opts.intervalMs ?? 10_000;
  const aggregationQuery = opts.query ?? "sol"; // pick a sane default

  const schedulerIntervalId = setInterval(async () => {
    console.log("scheduler ran at", new Date().toISOString());

    try {
      const previousTokenList =
        (await getCache<Token[]>(REDIS_SNAPSHOT_KEY)) ?? [];
      const previousTokenMap = new Map<string, Token>(
        previousTokenList.map((t) => [t.token_address, t])
      );

      const freshTokenList = await aggregateTokens(aggregationQuery);
      console.log("scheduler fetched:", freshTokenList.length, " tokens");
      
      const freshTokenMap = new Map<string, Token>(
        freshTokenList.map((t) => [t.token_address, t])
      );

      const priceChangeThreshold = Number(
        process.env.WS_PRICE_DELTA_THRESHOLD || 0.000001
      );
      const volumeChangeMultiplier = Number(
        process.env.WS_VOLUME_SPIKE_MULTIPLIER || 1.0001
      );

      for (const [tokenAddress, currentToken] of freshTokenMap.entries()) {
        const previousToken = previousTokenMap.get(tokenAddress);
        if (!previousToken) continue;

        const oldPrice = previousToken.price_sol || 0;
        const newPrice = currentToken.price_sol || 0;
        if (oldPrice > 0) {
          const priceDifferencePercent = (newPrice - oldPrice) / oldPrice;
          if (Math.abs(priceDifferencePercent) >= priceChangeThreshold) {
            console.log("EMIT price:change", {
              addr: tokenAddress,
              newPrice: newPrice,
              oldPrice: oldPrice,
              delta: priceDifferencePercent,
            });
            io.emit("price:update", {
              token_address: tokenAddress,
              newPrice: newPrice,
              oldPrice: oldPrice,
              delta: priceDifferencePercent,
              token: currentToken,
              ts: Date.now(),
            });
            console.log(
              "scheduler: price change",
              tokenAddress,
              priceDifferencePercent
            );
          }
        }

        const oldVolume = previousToken.volume_sol || 0;
        const newVolume = currentToken.volume_sol || 0;
        if (oldVolume > 0 && newVolume / oldVolume >= volumeChangeMultiplier) {
          console.log("EMIT vol inc", {
            addr: tokenAddress,
            multiplier: newVolume / oldVolume,
            oldVolume: oldVolume,
            newVolume: newVolume,
          });
          io.emit("volume:spike", {
            token_address: tokenAddress,
            oldVolume: oldVolume,
            newVolume: newVolume,
            multiplier: newVolume / oldVolume,
            token: currentToken,
            ts: Date.now(),
          });
          console.log(
            "scheduler: Vol inc",
            tokenAddress,
            newVolume / oldVolume
          );
        }
      }

      await setCache(REDIS_SNAPSHOT_KEY, freshTokenList, 0);
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  }, tickIntervalMs);

  return () => clearInterval(schedulerIntervalId); 
}