import type { ServiceSlug } from "./services";

/**
 * "Try it live" on the missed-call text-back page: a real number the reader
 * can call to receive the text their callers would get.
 *
 * The number itself is not copy. It comes from TEXTBACK_DEMO_NUMBER (see
 * lib/textbackDemo.ts), and the section renders only when that is set, so
 * nothing shows until the line is registered and tested. Nothing here claims a
 * result: it describes what happens when you call, which the reader then
 * checks for themselves.
 */
export const textbackDemo = {
  serviceSlug: "missed-call-text-back" satisfies ServiceSlug,
  eyebrow: "Try it live",
  heading: "Call it. Nobody will answer.",
  body: "That's the point. Within about a minute you'll get a text from Embedded Intent, the same kind of text your callers would get from you. Reply to it and your message reaches Gavin's phone.",
  callLabel: "Call",
  finePrint: [
    "One text per number per day.",
    "Reply STOP to opt out. Msg & data rates may apply.",
    "We use your number only to send that text and pass your reply to Gavin.",
  ],
} as const;
