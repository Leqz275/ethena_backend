import { FastifyInstance, FastifyRequest } from "fastify";
import { aggregateTokens } from "../services/aggregator";
import {
  filterTokens,
  sortTokens,
  paginateTokens,
} from "../utils/tokenListUtils";
import { TimeWindow } from "../types/token";


const tokenQuerySchema = {
  type: "object",
  properties: {
    q: { type: "string" },
    window: {
      type: "string",
      enum: ["1h", "24h", "7d"],
      default: "24h",
    },
    sort: {
      type: "string",
      enum: ["volume", "price", "marketCap", "priceChange"],
      default: "volume",
    },
    limit: {
      type: "integer",
      default: 20,
      minimum: 1,
      maximum: 100, 
    },
    cursor: { type: "string" },
  },
};

interface TokenQuery {
  q?: string;
  window: TimeWindow;
  sort: "volume" | "price" | "marketCap" | "priceChange";
  limit: number;
  cursor?: string;
}

export async function tokensRoute(app: FastifyInstance) {
  app.get(
    "/tokens",
    { schema: { querystring: tokenQuerySchema } },
    async (req: FastifyRequest<{ Querystring: TokenQuery }>, reply) => {
      const { q, window, sort, limit, cursor } = req.query;

      try {
        let tokens = await aggregateTokens(q || "");

        tokens = filterTokens(tokens, window);

        tokens = sortTokens(tokens, sort, window);

        const { items, nextCursor } = paginateTokens(
          tokens,
          sort,
          window,
          limit,
          cursor
        );

        return {
          count: items.length,
          nextCursor,
          items,
        };
      } catch (err) {
        console.error("Error in /tokens route:", err);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    }
  );
}