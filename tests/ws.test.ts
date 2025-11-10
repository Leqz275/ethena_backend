import { createServer, Server as HTTPServer } from "http";
import { initializeSocketServer } from "../src/ws/websocket";
import { io as Client } from "socket.io-client";

describe("WebSocket", () => {
  let httpServer: HTTPServer;
  let addr: { port: number };
  let wsServer: any;

  beforeAll((done) => {
    httpServer = createServer();

    wsServer = initializeSocketServer(httpServer, {
      priceDeltaThreshold: 0.01,
      volumeSpikeMultiplier: 2
    });

    httpServer.listen(() => {
      const addressInfo = httpServer.address();

      // address() can be string | AddressInfo | null
      if (addressInfo && typeof addressInfo === "object") {
        addr = { port: addressInfo.port };
      } else {
        throw new Error("Could not determine server port");
      }

      done();
    });
  });

  test("client receives hello event", (done) => {
    const client = Client(`http://localhost:${addr.port}`);

    client.on("hello", (data) => {
      expect(data.message).toBe("connected");
      client.disconnect();
      done();
    });
  });

  afterAll(() => {
    httpServer.close();
  });
});
