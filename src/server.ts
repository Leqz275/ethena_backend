import { buildApp } from "./app";
import { createServer } from "http";
import { initializeSocketServer } from "./ws/websocket";
import { startScheduler } from "./services/scheduler";

const PORT = Number(process.env.PORT || 8080);
const PRICE_DELTA_THRESHOLD = Number(process.env.WS_PRICE_DELTA_THRESHOLD || 0.000001); 
const VOLUME_SPIKE_MULTIPLIER = Number(process.env.WS_VOLUME_SPIKE_MULTIPLIER || 1.0001); 
const SCHEDULER_QUERY = process.env.SCHEDULER_QUERY || "sol";
const SCHEDULER_INTERVAL_MS = Number(process.env.SCHEDULER_INTERVAL_MS || 10_000);

async function main() {
  const app = buildApp();
  await app.ready();

  const httpServer = createServer((req, res) => {
    app.routing(req, res);
  });

  // attach socket.io
  const io = initializeSocketServer(httpServer, {
    priceDeltaThreshold: PRICE_DELTA_THRESHOLD,
    volumeSpikeMultiplier: VOLUME_SPIKE_MULTIPLIER,
  });

  // start delta scheduler
  startScheduler(io, {
    intervalMs: SCHEDULER_INTERVAL_MS,
    query: SCHEDULER_QUERY,
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`HTTP + WS server listening on :${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
