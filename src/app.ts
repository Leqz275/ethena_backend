import Fastify from "fastify";
import cors from "@fastify/cors";
import { tokensRoute } from "./routes/tokens";

// Read the allowed frontend URL from environment
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

export function buildApp() {
  const app = Fastify({ logger: true });

  // Register CORS with a specific origin
  app.register(cors, {
    origin: allowedOrigin,
    methods: ["GET"],
  });

  // Register our main API
  app.register(tokensRoute);

  // Health check for deployment environments
  app.get("/health", async () => ({ status: "ok" }));

  return app;
}