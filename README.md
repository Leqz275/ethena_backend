# Real-time Data Aggregation Service

This service aggregates real-time meme coin data from multiple sources, caches it, and provides a REST API and WebSocket connection for live updates.

**Public URL:** [https://YOUR-RENDER-URL.onrender.com/tokens?q=sol]
**Video Demo:** [Link to your 1-2 min YouTube video]

---

## 🛠 Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Fastify
- **Cache:** In-Memory `Map` (with JSON persistence)
- **WebSockets:** Socket.io
- **HTTP Client:** `axios` (with custom exponential backoff)
- **Testing:** Jest & ts-jest

---

## 🧠 Design Decisions

I made several key design decisions to meet the project requirements:

1.  **Data Aggregation:** I used a **two-stage merge** process.

    - **Stage 1 (Discovery):** Fetches from DexScreener and GeckoTerminal in parallel to find all tokens.
    - **Stage 2 (Price Fill):** It then finds any tokens _missing_ a price and makes a single, targeted call to Jupiter. This is more efficient than calling all three APIs for all tokens.

2.  **Caching:**

    - I chose a **persistent in-memory cache** to balance performance with simplicity.
    - The cache is a JavaScript `Map` that persists to a local `.memory_cache.json` file.
    - To avoid blocking the server, writes to disk are **debounced**. Multiple cache updates in a short period (1 second) are batched into a single asynchronous file write.
    - This implementation also handles the scheduler's "persist forever" requirement by treating a `0` TTL as `Infinity`.

3.  **Real-time Updates:**

    - I used a **"Poller-with-Diff"** pattern in `scheduler.ts`.
    - A scheduler runs every 10 seconds, fetches all data, and compares it to the previous snapshot (loaded from the in-memory cache).
    - It only broadcasts a WebSocket message (`price:update` or `volume:spike`) if a meaningful change (a "diff") is detected. This is highly efficient and avoids sending redundant data.

4.  **API Design:**
    - The `GET /tokens` endpoint uses **Fastify's schema validation** to secure and type-check all query parameters.
    - All processing (filtering, sorting) is done _in-memory_ on the server after fetching from the cache.
    - Pagination is implemented using an **opaque cursor**, which is the most robust way to handle real-time, rapidly changing data.

---

## 🚀 How to Run Locally

1.  Clone the repository:
    `git clone <your-repo-url>`
2.  Install dependencies:
    `npm install`
3.  Create a `.env` file in the root. (See `.env.example` if you made one).
    ```
    PORT=8080
    FRONTEND_URL=http://localhost:3000
    SCHEDULER_QUERY=sol
    ```
4.  Build and run the server:
    `npm run build`
    `npm start`

The server will automatically create and use `.memory_cache.json` in the root directory for persistence.

---

## 📦 API Collection

You can find a Postman/Insomnia collection in the root of this repo:
[Link to your Postman_collection.json file]
