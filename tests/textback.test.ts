import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadClients, type TextbackClient } from "../lib/textback/config.ts";
import { handleTextback, type TextbackDeps, type TextbackKind } from "../lib/textback/handler.ts";
import { computeTwilioSignature } from "../lib/textback/signature.ts";
import { createMemoryStore, createRedisStore, storeFromEnv } from "../lib/textback/store.ts";
import { createDryRunSendSms, createSendSms } from "../lib/textback/twilio.ts";

// Fake values only; none of these is a real credential.
const CLIENT: TextbackClient = {
  name: "Test Tents",
  twilioNumber: "+15165550100",
  ownerPhone: "+15165550199",
  accountSid: "ACtest",
  authToken: "test-token-not-real",
};
const ORIGIN = "https://example.test";
const CALLER = "+16315550123";

type Sent = { to: string; body: string };

function setup(sendResult: { ok: boolean; status: number; code?: number } = { ok: true, status: 201 }) {
  const sent: Sent[] = [];
  let t = 1_000_000;
  const deps: TextbackDeps = {
    clients: () => [CLIENT],
    sendSms: async (_c, to, body) => {
      sent.push({ to, body });
      return sendResult;
    },
    store: createMemoryStore(),
    now: () => t,
    publicOrigin: ORIGIN,
    dedupeWindowMs: 60_000,
  };
  return { deps, sent, advance: (ms: number) => (t += ms) };
}

function call(
  kind: TextbackKind,
  params: Record<string, string>,
  deps: TextbackDeps,
  opts: { token?: string; signature?: string | null } = {},
) {
  const path = `/api/textback/${kind}`;
  const sig =
    opts.signature === undefined
      ? computeTwilioSignature(opts.token ?? CLIENT.authToken, ORIGIN + path, params)
      : opts.signature;
  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  if (sig !== null) headers["x-twilio-signature"] = sig;
  return handleTextback(
    kind,
    new Request(`http://internal.local${path}`, {
      method: "POST",
      headers,
      body: new URLSearchParams(params),
    }),
    deps,
  );
}

const voice = { To: CLIENT.twilioNumber, From: CALLER, CallSid: "CA1" };
const sms = (Body: string) => ({ To: CLIENT.twilioNumber, From: CALLER, Body });

describe("signature", () => {
  it("is HMAC-SHA1 over url + sorted name/value pairs, base64", () => {
    // Expected value produced independently with openssl:
    //   printf '%s' 'https://example.test/hookA1B2zz' | openssl dgst -sha1 -hmac k3y -binary | base64
    // Params are given out of order on purpose.
    const sig = computeTwilioSignature("k3y", "https://example.test/hook", { z: "z", A: "1", B: "2" });
    assert.equal(sig, "M+Pqmv9whOizIIwSRghr9dzWr64=");
  });
});

describe("missed call", () => {
  it("texts the caller and rejects the call", async () => {
    const { deps, sent } = setup();
    const res = await call("voice", voice, deps);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /<Reject reason="busy"\/>/);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, CALLER);
    assert.match(sent[0].body, /Test Tents/);
    assert.match(sent[0].body, /STOP/);
  });

  it("texts once per caller per window", async () => {
    const { deps, sent, advance } = setup();
    await call("voice", voice, deps);
    await call("voice", voice, deps);
    assert.equal(sent.length, 1);
    advance(61_000);
    await call("voice", voice, deps);
    assert.equal(sent.length, 2);
  });

  it("status callback texts on no-answer only", async () => {
    const { deps, sent } = setup();
    await call("status", { ...voice, CallStatus: "completed" }, deps);
    assert.equal(sent.length, 0);
    await call("status", { ...voice, CallStatus: "no-answer" }, deps);
    assert.equal(sent.length, 1);
  });

  it("stops texting a number Twilio reports as opted out", async () => {
    const { deps, sent, advance } = setup({ ok: false, status: 400, code: 21610 });
    await call("voice", voice, deps);
    advance(61_000);
    await call("voice", voice, deps);
    assert.equal(sent.length, 1);
  });
});

describe("replies", () => {
  it("STOP records the opt-out and sends nothing", async () => {
    const { deps, sent, advance } = setup();
    const res = await call("sms", sms("stop"), deps);
    assert.equal(res.status, 200);
    assert.doesNotMatch(await res.text(), /<Message>/);
    assert.equal(sent.length, 0);
    advance(61_000);
    await call("voice", voice, deps);
    assert.equal(sent.length, 0, "no auto-text after STOP");
  });

  it("START lifts the opt-out", async () => {
    const { deps, sent } = setup();
    await call("sms", sms("STOP"), deps);
    await call("sms", sms("START"), deps);
    await call("voice", voice, deps);
    assert.equal(sent.length, 1);
  });

  it("HELP answers with the business name and STOP wording", async () => {
    const { deps, sent } = setup();
    const res = await call("sms", sms("Help"), deps);
    const text = await res.text();
    assert.match(text, /<Message>.*Test Tents.*STOP.*<\/Message>/);
    assert.equal(sent.length, 0);
  });

  it("forwards a normal reply to the owner", async () => {
    const { deps, sent } = setup();
    await call("sms", sms("Need a 20x40 tent June 5"), deps);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, CLIENT.ownerPhone);
    assert.match(sent[0].body, new RegExp(`\\${CALLER}.*20x40`));
  });
});

describe("rejects bad requests", () => {
  it("bad signature: 403, nothing sent", async () => {
    const { deps, sent } = setup();
    const res = await call("voice", voice, deps, { signature: "AAAA" });
    assert.equal(res.status, 403);
    assert.equal(sent.length, 0);
  });

  it("missing signature: 403", async () => {
    const { deps, sent } = setup();
    const res = await call("voice", voice, deps, { signature: null });
    assert.equal(res.status, 403);
    assert.equal(sent.length, 0);
  });

  it("signed with another account's token: 403", async () => {
    const { deps, sent } = setup();
    const res = await call("voice", voice, deps, { token: "someone-elses-token" });
    assert.equal(res.status, 403);
    assert.equal(sent.length, 0);
  });

  it("unknown destination number: 403", async () => {
    const { deps, sent } = setup();
    const res = await call("voice", { ...voice, To: "+19995550000" }, deps);
    assert.equal(res.status, 403);
    assert.equal(sent.length, 0);
  });

  it("tampered params fail the signature", async () => {
    const { deps, sent } = setup();
    const sig = computeTwilioSignature(CLIENT.authToken, `${ORIGIN}/api/textback/voice`, voice);
    const res = await call("voice", { ...voice, From: "+16315559999" }, deps, { signature: sig });
    assert.equal(res.status, 403);
    assert.equal(sent.length, 0);
  });
});

describe("config and sender", () => {
  it("loadClients fails closed on bad JSON or a template without STOP", () => {
    assert.deepEqual(loadClients("not json"), []);
    assert.deepEqual(loadClients(undefined), []);
    assert.deepEqual(loadClients(JSON.stringify([{ ...CLIENT, template: "Hi, call back later" }])), []);
    assert.equal(loadClients(JSON.stringify([CLIENT])).length, 1);
  });

  it("sendSms posts to the client's subaccount with basic auth", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const send = createSendSms((async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response("{}", { status: 201 });
    }) as unknown as typeof fetch);
    const r = await send(CLIENT, CALLER, "hello");
    assert.equal(r.ok, true);
    assert.match(seen!.url, /Accounts\/ACtest\/Messages\.json$/);
    const body = seen!.init.body as URLSearchParams;
    assert.equal(body.get("From"), CLIENT.twilioNumber);
    assert.equal(body.get("To"), CALLER);
  });
});

/**
 * A fake Upstash REST endpoint: a Map with expiry, speaking the same
 * `POST [cmd, ...args]` → `{ result }` protocol. `down` makes every call 503.
 */
function fakeRedis() {
  const data = new Map<string, { value: string; expiresAt?: number }>();
  let clock = 0;
  const state = { down: false, calls: [] as string[][], auth: [] as string[] };
  const live = (k: string) => {
    const e = data.get(k);
    if (e && e.expiresAt !== undefined && e.expiresAt <= clock) data.delete(k);
    return data.get(k);
  };
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    state.auth.push(String((init.headers as Record<string, string>).Authorization));
    if (state.down) return new Response("unavailable", { status: 503 });
    const [cmd, k, ...rest] = (JSON.parse(String(init.body)) as (string | number)[]).map(String);
    state.calls.push([cmd, k, ...rest]);
    let result: unknown = null;
    if (cmd === "SET") {
      const nx = rest.includes("NX");
      const px = rest.indexOf("PX");
      if (!(nx && live(k))) {
        data.set(k, { value: rest[0], expiresAt: px >= 0 ? clock + Number(rest[px + 1]) : undefined });
        result = "OK";
      }
    } else if (cmd === "EXISTS") result = live(k) ? 1 : 0;
    else if (cmd === "DEL") result = data.delete(k) ? 1 : 0;
    return Response.json({ result });
  }) as unknown as typeof fetch;
  return { fetchImpl, state, advance: (ms: number) => (clock += ms) };
}

describe("redis store", () => {
  it("claims once per window, atomically, with an expiry", async () => {
    const r = fakeRedis();
    const store = createRedisStore("https://redis.example.test/", "tok", r.fetchImpl);
    assert.equal(await store.claimText("+1", CALLER, 0, 60_000), true);
    assert.equal(await store.claimText("+1", CALLER, 0, 60_000), false);
    assert.equal(await store.claimText("+1", "+16315550124", 0, 60_000), true, "other callers unaffected");
    r.advance(60_000);
    assert.equal(await store.claimText("+1", CALLER, 0, 60_000), true);
    assert.deepEqual(r.state.calls[0].slice(2), ["0", "NX", "PX", "60000"]);
    assert.equal(r.state.auth[0], "Bearer tok");
  });

  it("records and lifts opt-outs", async () => {
    const r = fakeRedis();
    const store = createRedisStore("https://redis.example.test", "tok", r.fetchImpl);
    assert.equal(await store.isOptedOut("+1", CALLER), false);
    await store.setOptedOut("+1", CALLER, true);
    assert.equal(await store.isOptedOut("+1", CALLER), true);
    await store.setOptedOut("+1", CALLER, false);
    assert.equal(await store.isOptedOut("+1", CALLER), false);
  });

  it("when redis is down, still texts (Twilio enforces STOP)", async () => {
    const r = fakeRedis();
    r.state.down = true;
    const store = createRedisStore("https://redis.example.test", "tok", r.fetchImpl);
    const warn = console.warn;
    const warnings: string[] = [];
    console.warn = (...a: unknown[]) => void warnings.push(a.join(" "));
    try {
      assert.equal(await store.claimText("+1", CALLER, 0, 60_000), true);
      assert.equal(await store.isOptedOut("+1", CALLER), false);
    } finally {
      console.warn = warn;
    }
    assert.equal(warnings.length, 2);
    assert.ok(warnings.every((w) => !w.includes(CALLER)), "no phone numbers in logs");
  });

  it("drives the webhook end to end", async () => {
    const r = fakeRedis();
    const { deps, sent } = setup();
    deps.store = createRedisStore("https://redis.example.test", "tok", r.fetchImpl);
    await call("voice", voice, deps);
    await call("voice", voice, deps);
    assert.equal(sent.length, 1);
    await call("sms", sms("STOP"), deps);
    r.advance(61_000);
    await call("voice", voice, deps);
    assert.equal(sent.length, 1, "no auto-text after STOP");
  });

  it("storeFromEnv picks redis only when both url and token are set", async () => {
    // The memory store never calls fetch; a redis store would, and fail here.
    const original = globalThis.fetch;
    let fetched = 0;
    globalThis.fetch = (async () => {
      fetched++;
      return Response.json({ result: "OK" });
    }) as typeof fetch;
    try {
      await storeFromEnv({ KV_REST_API_URL: "https://x.test" }).claimText("+1", CALLER, 0, 1);
      assert.equal(fetched, 0);
      await storeFromEnv({ KV_REST_API_URL: "https://x.test", KV_REST_API_TOKEN: "t" }).claimText("+1", CALLER, 0, 1);
      assert.equal(fetched, 1);
      await storeFromEnv({ UPSTASH_REDIS_REST_URL: "https://x.test", UPSTASH_REDIS_REST_TOKEN: "t" }).claimText("+1", CALLER, 0, 1);
      assert.equal(fetched, 2);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("dry run", () => {
  it("logs the would-be text with the last four digits only, and never fetches", async () => {
    const lines: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("dry run must not call Twilio");
    }) as typeof fetch;
    try {
      const send = createDryRunSendSms((l) => lines.push(l));
      const r = await send(CLIENT, CALLER, "hello");
      assert.equal(r.ok, true);
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(lines.length, 1);
    assert.match(lines[0], /would text …0123 from Test Tents/);
    assert.ok(!lines[0].includes(CALLER));
  });
});

describe("demo flag", () => {
  it("shows only for a valid US number and formats it", async () => {
    const { demoLine } = await import("../lib/textbackDemo.ts");
    assert.equal(demoLine(""), null);
    assert.equal(demoLine("6315550123"), null, "needs +1");
    assert.equal(demoLine("+1631555012"), null, "too short");
    assert.equal(demoLine("+11315550123"), null, "area code can't start with 1");
    assert.deepEqual(demoLine(" +16315550123 "), { e164: "+16315550123", display: "(631) 555-0123" });
  });
});
