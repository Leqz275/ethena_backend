import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export interface WSDeps {
  priceDeltaThreshold: number;      
  volumeSpikeMultiplier: number;    
}

export function initializeSocketServer(httpServer: HTTPServer, deps: WSDeps) {
  const io = new IOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);  

    socket.emit("hello", { message: "connected", ts: Date.now() });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  (io as any).config = {
    priceDeltaThreshold: deps.priceDeltaThreshold,
    volumeSpikeMultiplier: deps.volumeSpikeMultiplier,
  };

  return io;
}
