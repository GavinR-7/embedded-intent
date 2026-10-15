/**
 * What the webhook has to remember: who it texted recently (so a caller who
 * rings three times gets one text) and who opted out.
 *
 * Twilio itself blocks sends to a number that replied STOP (error 21610), so
 * `optedOut` is a second line of defence and avoids a wasted API call, not the
 * only one.
 *
 * Two implementations:
 * - memory: tests and the fallback when no Redis is configured. Not durable
 *   across serverless instances, so a cold start can mean a second text.
 * - Upstash Redis over its REST API: durable, shared by every instance. Chosen
 *   automatically when its env vars exist (see `storeFromEnv`).
 */
export interface TextbackStore {
  /**
   * Atomically records "texted now" unless this caller was texted within the
   * window. True means the caller may be texted; false means skip. Claiming
   * before sending is what stops a retried webhook from double-texting.
   */
  claimText(clientKey: string, caller: string, now: number, windowMs: number): Promise<boolean>;
  isOptedOut(clientKey: string, caller: string): Promise<boolean>;
  setOptedOut(clientKey: string, caller: string, value: boolean): Promise<void>;
}

const key = (kind: "texted" | "optout", c: string, n: string) => `textback:${kind}:${c}:${n}`;

export function createMemoryStore(): TextbackStore {
  const texted = new Map<string, number>();
  const optedOut = new Set<string>();
  return {
    claimText: async (c, n, now, windowMs) => {
      const at = texted.get(key("texted", c, n));
      if (at !== undefined && now - at < windowMs) return false;
      texted.set(key("texted", c, n), now);
      return true;
    },
    isOptedOut: async (c, n) => optedOut.has(key("optout", c, n)),
    setOptedOut: async (c, n, v) =>
      void (v ? optedOut.add(key("optout", c, n)) : optedOut.delete(key("optout", c, n))),
  };
}

type RedisCommand = (string | number)[];

/**
 * Upstash Redis via its REST API: POST the command as a JSON array, get back
 * `{ result }`. Plain `fetch`, so no SDK dependency, and `fetchImpl` is
 * injectable so tests run against a fake.
 *
 * Every failure (network, auth, a 5xx) is logged and answered permissively:
 * claim = true, opted out = false. A rare duplicate text beats losing a lead,
 * and Twilio still refuses to text anyone who replied STOP.
 */
export function createRedisStore(
  url: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): TextbackStore {
  const base = url.replace(/\/$/, "");

  async function run(command: RedisCommand): Promise<{ ok: true; result: unknown } | { ok: false }> {
    try {
      const res = await fetchImpl(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { result?: unknown; error?: string };
      if (body.error) throw new Error(body.error);
      return { ok: true, result: body.result ?? null };
    } catch (error) {
      // The command name only: keys contain phone numbers.
      console.warn(`textback store: redis ${String(command[0])} failed, falling back`, String(error));
      return { ok: false };
    }
  }

  return {
    claimText: async (c, n, now, windowMs) => {
      // SET NX PX: set only if absent, expire after the window. "OK" = claimed.
      const r = await run(["SET", key("texted", c, n), now, "NX", "PX", Math.max(1, Math.round(windowMs))]);
      return r.ok ? r.result === "OK" : true;
    },
    isOptedOut: async (c, n) => {
      const r = await run(["EXISTS", key("optout", c, n)]);
      return r.ok ? r.result === 1 : false;
    },
    setOptedOut: async (c, n, v) => {
      await run(v ? ["SET", key("optout", c, n), 1] : ["DEL", key("optout", c, n)]);
    },
  };
}

/**
 * Redis when configured, memory otherwise. Accepts both names: the Vercel
 * Marketplace Upstash integration sets KV_REST_API_*, a direct Upstash
 * database gives UPSTASH_REDIS_REST_*.
 */
export function storeFromEnv(env: Record<string, string | undefined> = process.env): TextbackStore {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? createRedisStore(url, token) : createMemoryStore();
}

let shared: TextbackStore | undefined;

/** One store per server instance, so the memory fallback keeps its state between requests. */
export function defaultStore(): TextbackStore {
  shared ??= storeFromEnv();
  return shared;
}
