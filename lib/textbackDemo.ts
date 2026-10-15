/**
 * The "Try it live" flag. The demo section shows only when
 * TEXTBACK_DEMO_NUMBER is a valid US number in E.164 (+1 and ten digits).
 * Unset or malformed means no section, so a typo can't publish a wrong number.
 *
 * Service pages are prerendered, so this is read at build time: changing the
 * variable needs a redeploy.
 */
export interface DemoLine {
  /** For the tel: link, e.g. +16315550123. */
  e164: string;
  /** For people, e.g. (631) 555-0123. */
  display: string;
}

export function demoLine(raw: string | undefined = process.env.TEXTBACK_DEMO_NUMBER): DemoLine | null {
  const match = /^\+1([2-9]\d{2})([2-9]\d{2})(\d{4})$/.exec(raw?.trim() ?? "");
  if (!match) return null;
  const [, area, exchange, line] = match;
  return { e164: `+1${area}${exchange}${line}`, display: `(${area}) ${exchange}-${line}` };
}
