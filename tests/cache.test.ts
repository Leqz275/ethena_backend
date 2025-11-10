import { getCache, setCache } from "../src/cache/cache";

describe("Cache System", () => {
  test("returns null when key not set", () => {
    expect(getCache("missing")).toBeNull();
  });

  test("stores and retrieves value", () => {
    setCache("a", 123, 1);
    expect(getCache("a")).toBe(123);
  });

  test("expires after TTL", (done) => {
    setCache("temp", 500, 0.1);

    setTimeout(() => {
      expect(getCache("temp")).toBeNull();
      done();
    }, 120);
  });
});
