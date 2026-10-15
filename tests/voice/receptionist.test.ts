import { describe, expect, it } from "vitest";

import { receptionist } from "@/content/receptionist";
import { agentPrompt, retellAgentConfig } from "@/lib/voice/agent";
import { createCalClient } from "@/lib/voice/cal";
import { readVoiceConfig, receptionistEnabled } from "@/lib/voice/config";
import { handlePostCall, handleTools, SeenCalls } from "@/lib/voice/handlers";
import { signRetell, verifyRetell } from "@/lib/voice/signature";
import { formatSummary, MAX_SMS, plain, type RetellCall } from "@/lib/voice/summary";
import { pickSlots, spokenTime } from "@/lib/voice/tools";

import { ENV, fakeCal, KEY, NOW, OPEN, retellRequest } from "./fakes";

const now = () => NOW;

describe("signature", () => {
  const body = '{"event":"call_analyzed"}';
  it("accepts Retell's v=<ts>,d=<hmac> for the exact body", () => {
    expect(verifyRetell(body, signRetell(body, KEY, NOW.getTime()), KEY, NOW.getTime())).toBe(true);
  });
  it("matches the SDK's algorithm: HMAC-SHA256(key, body + timestamp)", async () => {
    const { createHmac } = await import("node:crypto");
    const d = createHmac("sha256", KEY).update(body + "1760000000000").digest("hex");
    expect(verifyRetell(body, `v=1760000000000,d=${d}`, KEY, 1760000000000)).toBe(true);
  });
  it("rejects a changed body, a wrong key, a stale timestamp and junk", () => {
    const sig = signRetell(body, KEY, NOW.getTime());
    expect(verifyRetell(`${body} `, sig, KEY, NOW.getTime())).toBe(false);
    expect(verifyRetell(body, signRetell(body, "other", NOW.getTime()), KEY, NOW.getTime())).toBe(false);
    expect(verifyRetell(body, sig, KEY, NOW.getTime() + 6 * 60 * 1000)).toBe(false);
    expect(verifyRetell(body, "v=1,d=zz", KEY, NOW.getTime())).toBe(false);
    expect(verifyRetell(body, null, KEY, NOW.getTime())).toBe(false);
  });
});

describe("flag and config", () => {
  it("is off unless RECEPTIONIST_ENABLED=1, previews included", () => {
    expect(receptionistEnabled({})).toBe(false);
    expect(receptionistEnabled({ RECEPTIONIST_ENABLED: "true", VERCEL_ENV: "preview" })).toBe(false);
    expect(receptionistEnabled({ RECEPTIONIST_ENABLED: "1" })).toBe(true);
  });
  it("names every missing or malformed variable", () => {
    const read = readVoiceConfig({ ...ENV, CAL_USERNAME: "", RECEPTIONIST_NOTIFY_TO: "516-555-0100" });
    expect(read).toEqual({ ok: false, missing: ["CAL_USERNAME", "RECEPTIONIST_NOTIFY_TO (not +1 and ten digits)"] });
  });

  it("answers 404 with the flag off, before looking at anything else", async () => {
    const res = await handleTools(retellRequest("tools", { name: "check_slots" }), { env: { ...ENV, RECEPTIONIST_ENABLED: "" }, now });
    expect(res.status).toBe(404);
    const post = await handlePostCall(retellRequest("post-call", {}), { env: {}, now });
    expect(post.status).toBe(404);
  });
  it("answers 503 when on but not configured, and 401 without a valid signature", async () => {
    const half = await handleTools(retellRequest("tools", {}), { env: { RECEPTIONIST_ENABLED: "1" }, now, log: () => {} });
    expect(half.status).toBe(503);
    const unsigned = await handleTools(retellRequest("tools", { name: "check_slots" }, { signature: null }), { env: ENV, now });
    expect(unsigned.status).toBe(401);
    const forged = await handleTools(retellRequest("tools", { name: "check_slots" }, { key: "guess" }), { env: ENV, now });
    expect(forged.status).toBe(401);
  });
});

describe("Cal.com client", () => {
  it("reads slots from GET /v2/slots by username and event slug, with no key", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return Response.json({ status: "success", data: { "2026-10-20": [{ start: "2026-10-20T10:00:00.000-04:00" }], "2026-10-19": [{ start: "2026-10-19T15:00:00.000Z" }] } });
    }) as typeof fetch;
    const cal = createCalClient({ username: "gavin", eventSlug: "intro-15" }, fetchImpl);
    expect(await cal.slots("2026-10-19T13:00:00.000Z", "2026-10-26T13:00:00.000Z", "America/New_York")).toEqual([
      "2026-10-19T15:00:00.000Z",
      "2026-10-20T14:00:00.000Z",
    ]);
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe("/v2/slots");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ username: "gavin", eventTypeSlug: "intro-15", timeZone: "America/New_York" });
    const headers = calls[0]!.init!.headers as Record<string, string>;
    expect(headers["cal-api-version"]).toBe("2024-09-04");
    expect(headers.Authorization).toBeUndefined();
  });
  it("books with POST /v2/bookings and sends the key only when there is one", async () => {
    let sent: { body: Record<string, unknown>; headers: Record<string, string> } | undefined;
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      sent = { body: JSON.parse(String(init!.body)), headers: init!.headers as Record<string, string> };
      return Response.json({ status: "success", data: { uid: "abc", start: "2026-10-20T14:00:00.000Z", status: "accepted" } });
    }) as typeof fetch;
    const cal = createCalClient({ username: "gavin", eventSlug: "intro-15", apiKey: "cal_test" }, fetchImpl);
    const result = await cal.book({ start: "2026-10-20T14:00:00.000Z", name: "Dana", phone: "+15165550111", timeZone: "America/New_York", notes: "x" });
    expect(result).toEqual({ ok: true, uid: "abc", start: "2026-10-20T14:00:00.000Z" });
    expect(sent!.headers["cal-api-version"]).toBe("2026-02-25");
    expect(sent!.headers.Authorization).toBe("Bearer cal_test");
    expect(sent!.body).toMatchObject({ username: "gavin", eventTypeSlug: "intro-15", attendee: { name: "Dana", phoneNumber: "+15165550111", timeZone: "America/New_York" } });
  });
  it("reports a refused booking instead of throwing", async () => {
    const fetchImpl = (async () => Response.json({ status: "error", error: { message: "slot unavailable" } }, { status: 400 })) as unknown as typeof fetch;
    const cal = createCalClient({ username: "gavin", eventSlug: "intro-15" }, fetchImpl);
    expect(await cal.book({ start: OPEN[0]!, name: "D", timeZone: "America/New_York", notes: "" })).toEqual({ ok: false, status: 400, message: "slot unavailable" });
  });
});

describe("tools", () => {
  const tz = "America/New_York";
  it("offers the first time on each of three days, read in Eastern time", () => {
    expect(pickSlots(OPEN, tz)).toEqual([OPEN[0], OPEN[2], OPEN[4]]);
    expect(spokenTime(OPEN[0]!, tz)).toBe("Monday, October 19 at 11:00 AM");
  });

  it("check_slots returns only real Cal.com times", async () => {
    const { cal } = fakeCal();
    const res = await handleTools(retellRequest("tools", { name: "check_slots", args: {} }), { env: ENV, now, cal });
    const json = (await res.json()) as { slots: { start: string }[]; result: string };
    expect(json.slots.map((s) => s.start)).toEqual([OPEN[0], OPEN[2], OPEN[4]]);
    expect(json.result).toContain("Monday, October 19 at 11:00 AM");
  });

  it("check_slots says so when the week is full", async () => {
    const { cal } = fakeCal([]);
    const json = (await (await handleTools(retellRequest("tools", { name: "check_slots" }), { env: ENV, now, cal })).json()) as { result: string };
    expect(json.result).toBe(receptionist.toolReplies.noSlots);
  });

  it("book books an offered time, using the caller ID when no number was given", async () => {
    const { cal, bookings } = fakeCal();
    const res = await handleTools(
      retellRequest("tools", {
        name: "book",
        call: { call_id: "call_1", from_number: "+15165550111" },
        args: { start: OPEN[2], name: "Dana Ruiz", business: "Ruiz Plumbing", reason: "Wants a new website" },
      }),
      { env: ENV, now, cal },
    );
    const json = (await res.json()) as { booked_start?: string; result: string };
    expect(json.booked_start).toBe(OPEN[2]);
    expect(json.result).toContain("Tuesday, October 20 at 10:00 AM");
    expect(bookings[0]).toMatchObject({ name: "Dana Ruiz", phone: "+15165550111", timeZone: tz });
    expect(bookings[0]!.notes).toContain("Ruiz Plumbing: Wants a new website");
  });

  it("book refuses a time Cal.com didn't offer, without calling Cal.com's booking endpoint", async () => {
    const { cal, bookings } = fakeCal();
    const json = (await (
      await handleTools(retellRequest("tools", { name: "book", args: { start: "2026-10-20T15:00:00Z", name: "Dana" } }), { env: ENV, now, cal })
    ).json()) as { result: string; booked_start?: string };
    expect(json.result).toBe(receptionist.toolReplies.slotGone);
    expect(json.booked_start).toBeUndefined();
    expect(bookings).toHaveLength(0);
  });

  it("book rejects missing arguments, and a Cal.com outage becomes 'take a message'", async () => {
    const { cal } = fakeCal();
    const bad = (await (await handleTools(retellRequest("tools", { name: "book", args: { name: "Dana" } }), { env: ENV, now, cal })).json()) as { result: string };
    expect(bad.result).toBe(receptionist.toolReplies.badRequest);
    const down = { ...cal, slots: async () => Promise.reject(new Error("timeout")) };
    const res = await handleTools(retellRequest("tools", { name: "check_slots" }), { env: ENV, now, cal: down, log: () => {} });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { result: string }).result).toBe(receptionist.toolReplies.failed);
  });
});

const bookedCall: RetellCall = {
  call_id: "call_8f2c19d4a7b3e650",
  direction: "inbound",
  from_number: "+15165550111",
  transcript_with_tool_calls: [
    { role: "tool_call_invocation", tool_call_id: "t1", name: "book", arguments: JSON.stringify({ start: OPEN[2], name: "Dana Ruiz", business: "Ruiz Plumbing", reason: "Wants a new website" }) },
    { role: "tool_call_result", tool_call_id: "t1", content: JSON.stringify({ result: "Booked", booked_start: OPEN[2] }) },
  ],
  call_analysis: { call_summary: "Dana booked an intro call." },
};

describe("summary SMS", () => {
  const opts = { timeZone: "America/New_York" };
  it("names the caller, number, booked time and reason in one plain text", () => {
    expect(formatSummary(bookedCall, opts)).toBe(
      "EI call: Dana Ruiz (Ruiz Plumbing), +15165550111. BOOKED Tue Oct 20 10:00 AM ET. Wants a new website Retell call_8f2c19d4a7b3e650",
    );
  });
  it("says 'No booking' when the book tool never confirmed, using the analysis fields", () => {
    const call: RetellCall = {
      call_id: "call_2",
      from_number: "+16315550122",
      transcript_with_tool_calls: [
        { role: "tool_call_invocation", tool_call_id: "t1", name: "book", arguments: JSON.stringify({ start: OPEN[0], name: "Sam" }) },
        { role: "tool_call_result", tool_call_id: "t1", content: JSON.stringify({ result: receptionist.toolReplies.failed }) },
      ],
      call_analysis: { custom_analysis_data: { reason: "Asked about Google reviews" } },
    };
    expect(formatSummary(call, opts)).toBe("EI call: Sam, +16315550122. No booking. Asked about Google reviews Retell call_2");
  });
  it("never goes over 300 characters or outside GSM-7, however long the reason", () => {
    const long: RetellCall = {
      ...bookedCall,
      call_analysis: { custom_analysis_data: {} },
      transcript_with_tool_calls: [
        { role: "tool_call_invocation", tool_call_id: "t1", name: "book", arguments: JSON.stringify({ name: "Zoë “Z” O’Brien", reason: "We need — urgently — ".repeat(40) }) },
      ],
    };
    const text = formatSummary(long, { ...opts, callLink: "https://dashboard.example/call/{call_id}" });
    expect(text.length).toBeLessThanOrEqual(MAX_SMS);
    expect(text).toMatch(/^[A-Za-z0-9 @$_!"#%&'()*+,\-./:;<=>?]+$/);
    expect(text).toContain('Zo "Z" O\'Brien');
    expect(text.endsWith("https://dashboard.example/call/call_8f2c19d4a7b3e650")).toBe(true);
    expect(plain("a—b…")).toBe("a-b...");
  });
});

describe("post-call webhook", () => {
  it("texts Gavin once per call on call_analyzed, ignores other events, and dedupes Retell's retries", async () => {
    const texts: { to: string; body: string }[] = [];
    const deps = { env: ENV, now, seen: new SeenCalls(), sendSms: async (to: string, body: string) => (texts.push({ to, body }), { ok: true, status: 201 }) };
    expect((await handlePostCall(retellRequest("post-call", { event: "call_ended", call: bookedCall }), deps)).status).toBe(204);
    expect((await handlePostCall(retellRequest("post-call", { event: "call_analyzed", call: bookedCall }), deps)).status).toBe(200);
    const retry = await handlePostCall(retellRequest("post-call", { event: "call_analyzed", call: bookedCall }), deps);
    expect(await retry.json()).toEqual({ ok: true, duplicate: true });
    expect(texts).toHaveLength(1);
    expect(texts[0]!.to).toBe(ENV.RECEPTIONIST_NOTIFY_TO);
  });
  it("RECEPTIONIST_DRY_RUN=1 logs the text instead of calling Twilio", async () => {
    const lines: string[] = [];
    const res = await handlePostCall(retellRequest("post-call", { event: "call_analyzed", call: bookedCall }), {
      env: { ...ENV, RECEPTIONIST_DRY_RUN: "1" },
      now,
      seen: new SeenCalls(),
      log: (l) => lines.push(l),
    });
    expect(res.status).toBe(200);
    expect(lines[0]).toMatch(/^receptionist dry-run: would text \.\.\.0100/);
  });
});

describe("agent config", () => {
  it("opens with the recording disclosure and carries every 'never' rule", () => {
    const config = retellAgentConfig("https://embeddedintent.com");
    expect(config.llm.begin_message).toContain("This is the AI assistant for Embedded Intent. This call may be recorded and summarized.");
    for (const rule of receptionist.never) expect(agentPrompt()).toContain(rule);
    expect(config.llm.general_tools.map((t) => t.name)).toEqual(["check_slots", "book", "end_call"]);
    expect(config.agent.webhook_url).toBe("https://embeddedintent.com/api/voice/post-call");
  });
  it("puts no price in the prompt", () => {
    expect(agentPrompt()).not.toMatch(/\$\s?\d/);
  });
});
