/**
 * The model call: Anthropic's Messages API over plain fetch.
 *
 * No SDK. This is one POST with a JSON body, and the SDK would add a server
 * dependency to do it. Model is Claude Haiku 5.5 unless CHAT_MODEL says
 * otherwise; CHATBOT_SPEC.md has the price and why it is enough.
 *
 * The knowledge block goes in the system prompt with cache_control, so after
 * the first turn of a conversation it is billed at the cache-read rate.
 */
import type { ChatMessage } from "./request";

export const DEFAULT_MODEL = "claude-haiku-5-5";
export const MAX_OUTPUT_TOKENS = 350;
const ENDPOINT = "https://api.anthropic.com/v1/messages";
const TIMEOUT_MS = 20_000;

/** The model ends its reply with one of these; the route strips it. */
export const HANDOFF_MARK = "[[HANDOFF]]";
export const UNKNOWN_MARK = "[[UNKNOWN]]";

export function systemPrompt(siteName: string, ownerName: string): string {
  return `You are the chat on ${siteName}'s website. ${siteName} builds websites and automations for local service businesses. Visitors are usually business owners on a phone.

Rules, in order of importance:
1. Answer ONLY from the KNOWLEDGE below. Never add a fact, number, price, timeline, guarantee, client name, result or link that is not written there.
2. Never add, multiply, discount or combine prices. Quote a service's price exactly as written, and say a real quote comes from ${ownerName} after the free audit.
3. If the KNOWLEDGE does not answer the question, reply with exactly ${UNKNOWN_MARK} and nothing else.
4. If the visitor wants a quote, to hire, to talk to a person, a callback, or to book, answer briefly if you can and end with ${HANDOFF_MARK}.
5. Never claim to be a person. Never promise a date, a price, or a result.
6. Off-topic requests (not about this business or its services): say you can only help with questions about ${siteName}.
7. Plain text, no markdown headings or tables. Two to four short sentences. Link a service page only by the exact URL in KNOWLEDGE.`;
}

export type ModelFetch = (url: string, init: RequestInit) => Promise<Response>;

export type ModelReply = { text: string; usage: { input: number; cacheRead: number; cacheWrite: number; output: number } };

type ApiResponse = {
  content?: { type: string; text?: string }[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};

export async function askModel(opts: {
  apiKey: string;
  model: string;
  system: string;
  knowledge: string;
  messages: ChatMessage[];
  fetcher?: ModelFetch;
}): Promise<ModelReply> {
  const fetcher = opts.fetcher ?? fetch;
  const res = await fetcher(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0,
      system: [
        { type: "text", text: opts.system },
        { type: "text", text: `KNOWLEDGE\n\n${opts.knowledge}`, cache_control: { type: "ephemeral" } },
      ],
      messages: opts.messages,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as ApiResponse;
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
  const u = data.usage ?? {};
  return {
    text,
    usage: {
      input: u.input_tokens ?? 0,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
      output: u.output_tokens ?? 0,
    },
  };
}
