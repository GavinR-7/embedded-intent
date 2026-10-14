import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadClients, type TextbackClient } from "../lib/textback/config.ts";
import { handleTextback, type TextbackDeps, type TextbackKind } from "../lib/textback/handler.ts";
import { computeTwilioSignature } from "../lib/textback/signature.ts";
import { createMemoryStore } from "../lib/textback/store.ts";
import { createSendSms } from "../lib/textback/twilio.ts";

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
