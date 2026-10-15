/**
 * The "nothing it says is invented" check, run on every model reply before it
 * reaches the visitor.
 *
 * The prompt tells the model to answer only from the knowledge block. This is
 * what makes that a rule rather than a hope: every number, dollar amount,
 * email address and domain in the reply has to appear in the knowledge block
 * too, or the reply is thrown away and the visitor gets a fixed line offering
 * a callback instead. It cannot catch a wrong sentence with no numbers in it;
 * it does catch the failure that costs money, a made-up price or timeline.
 *
 * Deliberately strict. A reply that does arithmetic ("$1,650 all in") fails,
 * because a sum the site never states is a quote, and quotes come from Gavin.
 */

export type GuardResult = { ok: true } | { ok: false; reason: string };

/** Numbers a reply may use without the knowledge block stating them. */
const FREE_NUMBERS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

const NUMBER = /\d[\d,]*(?:\.\d+)?/g;
const DOLLARS = /\$\s?(\d[\d,]*(?:\.\d+)?)\s?([kK])?\b/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const DOMAIN = /\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+(?:com|net|org|io|co|us|ai|app|dev|biz|info))\b/gi;

const toNumber = (raw: string) => Number(raw.replaceAll(",", ""));

export function numbersIn(text: string): Set<number> {
  return new Set([...text.matchAll(NUMBER)].map((m) => toNumber(m[0])));
}

const lower = (xs: Iterable<string>) => new Set([...xs].map((x) => x.toLowerCase().replace(/^www\./, "")));

export function guardReply(reply: string, knowledge: string): GuardResult {
  const known = numbersIn(knowledge);

  for (const m of reply.matchAll(DOLLARS)) {
    const value = toNumber(m[1]) * (m[2] ? 1000 : 1);
    if (!known.has(value)) return { ok: false, reason: `dollar amount ${m[0]} not on the site` };
  }

  // Emails first, then strip them so their domains are not checked twice.
  const knownEmails = lower([...knowledge.matchAll(EMAIL)].map((m) => m[0]));
  for (const m of reply.matchAll(EMAIL)) {
    if (!knownEmails.has(m[0].toLowerCase())) return { ok: false, reason: `email ${m[0]} not on the site` };
  }
  const rest = reply.replace(EMAIL, " ");

  const knownDomains = lower([...knowledge.matchAll(DOMAIN)].map((m) => m[1]));
  for (const m of rest.matchAll(DOMAIN)) {
    if (!knownDomains.has(m[1].toLowerCase().replace(/^www\./, ""))) {
      return { ok: false, reason: `domain ${m[1]} not on the site` };
    }
  }

  // Strip site URLs before the number check: /services/... paths carry none,
  // but a query string or port someday might.
  for (const n of numbersIn(rest.replace(DOMAIN, " "))) {
    if (!FREE_NUMBERS.has(n) && !known.has(n)) return { ok: false, reason: `number ${n} not on the site` };
  }

  return { ok: true };
}
