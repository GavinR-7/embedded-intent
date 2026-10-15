/**
 * The no-model answerer: keyword matching over the same content modules.
 *
 * Runs when ANTHROPIC_API_KEY is unset (so a preview shows the chat working
 * without a key) and when the model call fails or its reply fails the guard
 * on a question this can answer. It can only ever say what the content
 * modules say, because every reply is a content/chat.ts template filled from
 * content/services.ts, content/faq.ts or content/site.ts. Costs nothing.
 *
 * It is a fallback, not the product: anything it does not recognize gets the
 * fixed "I won't make that up, leave your number" reply.
 */
import { chat } from "@/content/chat";
import { faqs, type FaqItem } from "@/content/faq";
import { formatPricing, getService, primaryService, type Service, type ServiceSlug } from "@/content/services";
import { fillOwner, site } from "@/content/site";

import { servicePath } from "./knowledge";
import type { ChatResponse } from "./request";

/**
 * Words that point at a service. Matching vocabulary, not copy: nothing here
 * is shown to anyone. Order inside the record is the tie-break, so the primary
 * website service wins a bare "website".
 */
const SERVICE_WORDS: Record<ServiceSlug, readonly string[]> = {
  "website-design-build": ["website", "site", "web site", "new site", "build a site", "web design", "webpage"],
  "website-refresh": ["refresh", "redesign", "update my site", "fix my site", "existing site", "old site"],
  "online-booking-setup": ["booking", "book online", "schedule", "scheduling", "appointments", "calendar"],
  "quote-price-calculator": ["calculator", "estimate tool", "instant quote", "price calculator", "quote tool"],
  "ai-lead-response": ["chatbot", "chat bot", "ai lead", "lead response", "answer leads", "respond to leads", "ai chat"],
  "missed-call-text-back": ["missed call", "text back", "text-back", "missed calls", "voicemail"],
  "get-more-google-reviews": ["reviews", "review", "stars", "rating"],
  "get-found-on-google": ["seo", "found on google", "google maps", "map pack", "ranking", "rank", "local search", "business profile"],
  "google-ads-management": ["ads", "google ads", "ppc", "adwords", "advertising", "ad spend"],
  "social-content-engine": ["social", "instagram", "facebook", "posts", "content"],
  "custom-ai-automation": ["automation", "automate", "ai automation", "custom ai", "workflow", "zapier"],
};

const PRICE = ["cost", "price", "how much", "charge", "pricing", "fee", "afford", "expensive", "cheap", "budget", "monthly"];
const TIME = ["how long", "how fast", "how quick", "timeline", "turnaround", "weeks", "when can", "how soon"];
const AREA = ["area", "where are you", "located", "location", "outside", "long island", "nassau", "suffolk", "new york", "nyc", "cover", "serve", "remote", "near me"];
const HANDOFF = ["quote", "hire", "call me", "talk to", "speak to", "a person", "human", "someone", "contact", "get started", "sign up", "book a call", "callback", "call back", "reach you"];

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9$ ]+/g, " ").replace(/\s+/g, " ")} `;
const has = (text: string, words: readonly string[]) => words.some((w) => text.includes(` ${w} `) || text.includes(` ${w}s `));

const fill = (template: string, values: Record<string, string>) =>
  fillOwner(template).replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function matchService(text: string): Service | undefined {
  const t = norm(text);
  let best: { slug: ServiceSlug; hits: number } | undefined;
  for (const [slug, words] of Object.entries(SERVICE_WORDS) as [ServiceSlug, readonly string[]][]) {
    // Weighted by phrase length, so "old site" beats the bare "site".
    const hits = words
      .filter((w) => t.includes(` ${w} `) || t.includes(` ${w}s `))
      .reduce((n, w) => n + w.split(" ").length, 0);
    if (hits > 0 && (!best || hits > best.hits)) best = { slug, hits };
  }
  return best ? getService(best.slug) : undefined;
}

const STOP = new Set(["the", "a", "an", "do", "does", "i", "you", "my", "it", "is", "to", "of", "and", "what", "how", "can", "your", "for", "in", "on", "if", "we", "me"]);
const words = (s: string) => norm(s).trim().split(" ").filter((w) => w.length > 2 && !STOP.has(w));

/** The FAQ entry sharing the most meaningful words with the question, if any shares two. */
export function matchFaq(text: string): FaqItem | undefined {
  const q = new Set(words(text));
  let best: { item: FaqItem; score: number } | undefined;
  for (const item of faqs) {
    const score = words(item.question).filter((w) => q.has(w)).length;
    if (score >= 2 && (!best || score > best.score)) best = { item, score };
  }
  return best?.item;
}

const faqById = (id: string) => faqs.find((f) => f.id === id);

export function answerLocally(question: string): ChatResponse {
  const t = norm(question);
  const wantsHandoff = has(t, HANDOFF);
  const service = matchService(question);
  const url = (s: Service) => `${site.url}${servicePath(s)}`;
  const reply = (text: string, handoff = wantsHandoff): ChatResponse => ({ reply: text, handoff, source: "local" });

  if (service) {
    if (has(t, TIME)) return reply(fill(chat.local.serviceTimeline, { name: service.name, timeline: service.timeline, url: url(service) }));
    if (has(t, PRICE) || wantsHandoff) {
      return reply(fill(chat.local.servicePrice, { name: service.name, price: formatPricing(service.pricing), promise: service.promise, url: url(service) }));
    }
    return reply(fill(chat.local.serviceAbout, { name: service.name, promise: service.promise, forWhom: lowerFirst(service.forWhom), url: url(service) }));
  }

  if (has(t, AREA)) return reply(fill(chat.local.area, { area: site.serviceArea }));

  const faq = matchFaq(question);
  if (faq) return reply(faq.answer);

  // No service named: answer the general version of the question.
  if (has(t, TIME)) return reply(faqById("how-long")?.answer ?? primaryService.timeline);
  if (has(t, PRICE)) return reply(faqById("what-does-it-cost")?.answer ?? chat.replies.unknown);

  if (wantsHandoff) return reply(fill(chat.local.handoff, {}), true);
  return { reply: chat.replies.unknown, handoff: true, source: "fixed" };
}
