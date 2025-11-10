export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // To avoid retry on timeouts or DNS failures too much
    if (err.code === "ECONNABORTED") {
      if (retries <= 0) return [] as any;
    }

    if (retries <= 0) throw err;

    const nextDelay = delay * 2 + Math.random() * 100;
    await new Promise((res) => setTimeout(res, nextDelay));

    return retry(fn, retries - 1, nextDelay);
  }
}
