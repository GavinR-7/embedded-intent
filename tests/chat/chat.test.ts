import { beforeEach, describe, expect, it, vi } from "vitest";

import { chat } from "@/content/chat";
import { faqs } from "@/content/faq";
import { formatPricing, getService, services } from "@/content/services";
import { fillOwner, site } from "@/content/site";
import { chatEnabled } from "@/lib/chat/flag";
import { guardReply } from "@/lib/chat/guard";
import { handleChat } from "@/lib/chat/handler";
import { buildKnowledge } from "@/lib/chat/knowledge";
import { answerLocally, matchService } from "@/lib/chat/local";
import { HANDOFF_MARK, UNKNOWN_MARK, type ModelFetch } from "@/lib/chat/model";
import { MAX_TURNS } from "@/lib/chat/request";
import { CHAT_HANDOFF_KEY, takeChatHandoff } from "@/lib/chat/shared";

const knowledge = buildKnowledge();

describe("flag", () => {
  it("is off in production unless set", () => {
    expect(chatEnabled({})).toBe(false);
    expect(chatEnabled({ VERCEL_ENV: "production" })).toBe(false);
    expect(chatEnabled({ VERCEL_ENV: "production", CHAT_ENABLED: "1" })).toBe(true);
  });
  it("is on in previews unless turned off", () => {
    expect(chatEnabled({ VERCEL_ENV: "preview" })).toBe(true);
    expect(chatEnabled({ VERCEL_ENV: "preview", CHAT_ENABLED: "0" })).toBe(false);
  });
});

describe("knowledge", () => {
  it("states every service's price exactly as the site formats it", () => {
    for (const s of services) {
      expect(knowledge).toContain(s.name);
      if (s.pricing.build) expect(knowledge).toContain(formatPricing(s.pricing).split(" to build")[0]);
    }
  });
  it("includes every FAQ answer and the contact details", () => {
    for (const f of faqs) expect(knowledge).toContain(f.answer);
    expect(knowledge).toContain(site.serviceArea);
    if (site.email) expect(knowledge).toContain(site.email);
  });
});

describe("guard", () => {
  it("passes a reply that quotes a real price, timeline and page", () => {
    const reply =
      "Website Design & Build is $1,500–5,000 to build, most land at $2,500–4,000, then $150/mo. See https://embeddedintent.com/services/website-design-build";
    expect(guardReply(reply, knowledge)).toEqual({ ok: true });
  });
  it("rejects an invented price", () => {
    expect(guardReply("A website is $999.", knowledge).ok).toBe(false);
    expect(guardReply("Around $7k all in.", knowledge).ok).toBe(false);
  });
  it("rejects arithmetic the site never states", () => {
    // 1,500 + 150 is a quote, not a fact on the page.
    expect(guardReply("So $1,650 for the first month.", knowledge).ok).toBe(false);
  });
  it("rejects invented numbers, emails and domains", () => {
    expect(guardReply("We've built 47 sites.", knowledge).ok).toBe(false);
    expect(guardReply("Email sales@embeddedintent.co for that.", knowledge).ok).toBe(false);
    expect(guardReply("Try wix.com instead.", knowledge).ok).toBe(false);
  });
  it("allows small counting numbers and the real contact details", () => {
    const contact = `Email ${site.email} or call ${site.phone?.display}. It takes 2 steps.`;
    expect(guardReply(contact, knowledge)).toEqual({ ok: true });
  });
});

describe("local answerer", () => {
  it("answers a price question with the site's own price and page", () => {
    const r = answerLocally("What does a new website cost?");
    const s = getService("website-design-build")!;
    expect(r.reply).toContain(formatPricing(s.pricing));
    expect(r.reply).toContain(`${site.url}/services/website-design-build`);
    expect(guardReply(r.reply, knowledge).ok).toBe(true);
  });
  it("picks the more specific service", () => {
    expect(matchService("can you fix my old site")?.slug).toBe("website-refresh");
    expect(matchService("how much for missed call text back")?.slug).toBe("missed-call-text-back");
  });
  it("answers timeline and area questions from content", () => {
    expect(answerLocally("How fast can you build it?").reply).toBe(faqs.find((f) => f.id === "how-long")!.answer);
    expect(answerLocally("Do you work outside Long Island?").reply).toContain(site.serviceArea);
  });
  it("refuses what it does not know, and offers the handoff", () => {
    const r = answerLocally("What's the weather in Paris?");
    expect(r).toEqual({ reply: chat.replies.unknown, handoff: true, source: "fixed" });
  });
  it("hands off when asked for a person", () => {
    expect(answerLocally("Can someone call me back?").handoff).toBe(true);
  });
  it("never says anything the guard would reject, for every starter suggestion", () => {
    for (const q of chat.suggestions) expect(guardReply(answerLocally(q).reply, knowledge).ok).toBe(true);
  });
});

const post = (body: unknown) =>
  new Request("http://localhost/api/chat", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const ask = (q: string) => post({ messages: [{ role: "user", content: q }] });

function fakeModel(text: string) {
  const calls: { body: Record<string, unknown> }[] = [];
  const fetcher: ModelFetch = vi.fn(async (_url: string, init: RequestInit) => {
    calls.push({ body: JSON.parse(String(init.body)) });
    return Response.json({ content: [{ type: "text", text }], usage: { input_tokens: 10, output_tokens: 5 } });
  });
  return { fetcher, calls };
}

describe("handler", () => {
  const on = { CHAT_ENABLED: "1" };
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("404s when the flag is off", async () => {
    expect((await handleChat(ask("hi"), { env: {} })).status).toBe(404);
  });
  it("400s on a malformed or oversized request", async () => {
    expect((await handleChat(post({ messages: [] }), { env: on })).status).toBe(400);
    expect((await handleChat(ask("x".repeat(501)), { env: on })).status).toBe(400);
    expect((await handleChat(post({ messages: [{ role: "assistant", content: "hi" }] }), { env: on })).status).toBe(400);
  });
  it("answers locally with no API key", async () => {
    const res = await handleChat(ask("What does a new website cost?"), { env: on });
    expect(await res.json()).toMatchObject({ source: "local" });
  });
  it("passes a clean model reply through and reads the handoff mark", async () => {
    const { fetcher, calls } = fakeModel(`Missed-Call Text-Back is $800–1,200 to build, then $100/mo. ${HANDOFF_MARK}`);
    const res = await handleChat(ask("price for text back? call me"), { env: { ...on, ANTHROPIC_API_KEY: "test" }, fetcher });
    expect(await res.json()).toEqual({ reply: "Missed-Call Text-Back is $800–1,200 to build, then $100/mo.", handoff: true, source: "model" });
    expect(calls[0].body.model).toBe("claude-haiku-5-5");
  });
  it("replaces a model reply with an invented price", async () => {
    const { fetcher } = fakeModel("A website is about $999.");
    const res = await handleChat(ask("website cost?"), { env: { ...on, ANTHROPIC_API_KEY: "test" }, fetcher });
    expect(await res.json()).toEqual({ reply: fillOwner(chat.replies.unverified), handoff: true, source: "fixed" });
  });
  it("turns the unknown mark into the fixed refusal", async () => {
    const { fetcher } = fakeModel(UNKNOWN_MARK);
    const res = await handleChat(ask("Do you do plumbing?"), { env: { ...on, ANTHROPIC_API_KEY: "test" }, fetcher });
    expect(await res.json()).toEqual({ reply: chat.replies.unknown, handoff: true, source: "fixed" });
  });
  it("falls back to the local answerer when the model call fails", async () => {
    const fetcher: ModelFetch = async () => new Response("overloaded", { status: 529 });
    const res = await handleChat(ask("What does a new website cost?"), { env: { ...on, ANTHROPIC_API_KEY: "test" }, fetcher });
    expect(await res.json()).toMatchObject({ source: "local" });
  });
  it("stops after the turn cap without calling the model", async () => {
    const messages = Array.from({ length: MAX_TURNS + 1 }, (_, i) => [
      { role: "user", content: `q${i}` },
      { role: "assistant", content: `a${i}` },
    ]).flat().slice(0, -1);
    const { fetcher, calls } = fakeModel("unused");
    const res = await handleChat(post({ messages }), { env: { ...on, ANTHROPIC_API_KEY: "test" }, fetcher });
    expect(await res.json()).toEqual({ reply: chat.replies.tooLong, handoff: true, source: "fixed" });
    expect(calls).toHaveLength(0);
  });
  it("caches the knowledge block in the system prompt", async () => {
    const { fetcher, calls } = fakeModel("Ok.");
    await handleChat(ask("hi"), { env: { ...on, ANTHROPIC_API_KEY: "test" }, fetcher });
    const system = calls[0].body.system as { text: string; cache_control?: unknown }[];
    expect(system.at(-1)?.cache_control).toEqual({ type: "ephemeral" });
    expect(system.at(-1)?.text).toContain(knowledge);
  });
});

describe("handoff storage", () => {
  const store = (v: string | null) => {
    const m = new Map<string, string>(v === null ? [] : [[CHAT_HANDOFF_KEY, v]]);
    return { getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k), m };
  };
  it("reads once and removes", () => {
    const s = store(JSON.stringify({ name: "Pat", business: "Pat's HVAC", phone: "555", questions: ["cost?"] }));
    expect(takeChatHandoff(s)).toEqual({ name: "Pat", business: "Pat's HVAC", phone: "555", questions: ["cost?"] });
    expect(s.m.size).toBe(0);
    expect(takeChatHandoff(s)).toBeNull();
  });
  it("survives junk", () => {
    expect(takeChatHandoff(store("{not json"))).toBeNull();
    expect(takeChatHandoff(store(JSON.stringify({ name: 5, questions: "x" })))).toEqual({ name: "", business: "", phone: "", questions: [] });
  });
});
