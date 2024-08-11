import { kv } from "./kv.ts";

export async function cleanUpExpiredEntries(): Promise<void> {
  const now = Date.now();
  const expirationTime = 30 * 24 * 60 * 60 * 1000; 

  const iterator = kv.list(["codes"]);

  for await (const { key, value } of iterator) {
    const { timestamp } = value;
    if (now - timestamp > expirationTime) {
      await kv.delete(key);
      console.log(`Deleted expired entry with key: ${key}`);
    }
  }
}
