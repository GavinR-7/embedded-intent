/**
 * What the webhook has to remember: who it texted recently (so a caller who
 * rings three times gets one text) and who opted out.
 *
 * Twilio itself blocks sends to a number that replied STOP (error 21610), so
 * `optedOut` is a second line of defence and avoids a wasted API call, not the
 * only one. The default store is in memory: fine for tests and one warm
 * instance, NOT durable across serverless instances. A durable store (Vercel
 * KV/Postgres) is a decision for Gavin; see BUILD_NOTES.md.
 */
export interface TextbackStore {
  wasTextedRecently(clientKey: string, caller: string, now: number, windowMs: number): boolean;
  markTexted(clientKey: string, caller: string, now: number): void;
  isOptedOut(clientKey: string, caller: string): boolean;
  setOptedOut(clientKey: string, caller: string, value: boolean): void;
}

export function createMemoryStore(): TextbackStore {
  const texted = new Map<string, number>();
  const optedOut = new Set<string>();
  const key = (c: string, n: string) => `${c}|${n}`;
  return {
    wasTextedRecently: (c, n, now, windowMs) => {
      const at = texted.get(key(c, n));
      return at !== undefined && now - at < windowMs;
    },
    markTexted: (c, n, now) => void texted.set(key(c, n), now),
    isOptedOut: (c, n) => optedOut.has(key(c, n)),
    setOptedOut: (c, n, v) => void (v ? optedOut.add(key(c, n)) : optedOut.delete(key(c, n))),
  };
}

export const defaultStore = createMemoryStore();
