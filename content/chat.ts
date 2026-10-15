/**
 * The site chat: every visible string in the widget, plus the fixed replies the
 * server sends when it will not let the model answer.
 *
 * Behind the CHAT_ENABLED flag (lib/chat/flag.ts). CHATBOT_SPEC.md says what it
 * answers, what it refuses and how it hands off; this module is the words.
 *
 * Prices are not written here. Anything the chat says about cost is read from
 * content/services.ts at request time, so the chat cannot quote a stale number.
 */

export const chat = {
  /** The floating button. */
  openLabel: "Ask a question",
  closeLabel: "Close chat",

  heading: "Ask us anything",
  /** Under the heading: what this is, before anyone types. */
  intro:
    "Answers come from what's on this site — services, prices, timelines. If it doesn't know, it says so and you can leave your number instead.",

  /** First bubble, from the assistant. */
  greeting:
    "Hi. Ask about any service, what it costs or how long it takes. Or tap “Leave your number” and we'll call you.",

  /** Tappable starters. Questions, never prices: prices stay on service pages. */
  suggestions: [
    "What does a new website cost?",
    "How fast can you build it?",
    "Do you work outside Long Island?",
  ],

  inputLabel: "Your question",
  inputPlaceholder: "Type a question…",
  sendLabel: "Send",
  sendingLabel: "Thinking…",

  /* -----------------------------------------------------------------------
     Handoff: name, business and phone, then on to the audit form with those
     three filled in. The chat never submits anything itself.
     ----------------------------------------------------------------------- */
  handoffButton: "Leave your number",
  handoffHeading: "Leave your number",
  handoffIntro:
    "Three things, then the audit form opens with them filled in. Add your email there and send it.",
  nameLabel: "Your name",
  businessLabel: "Business name",
  phoneLabel: "Phone",
  handoffSubmit: "Continue to the form",
  handoffCancel: "Back to questions",
  /** First line of the audit form's message box after a handoff; the questions follow. */
  handoffMessagePrefix: "Asked in the site chat:",

  /* -----------------------------------------------------------------------
     Fixed replies. The server sends these, never the model's own wording,
     when the model is off, failed, or tried to say something the site does
     not say (see lib/chat/guard.ts).
     ----------------------------------------------------------------------- */
  replies: {
    /** The model reply mentioned a number, email, phone or link not on this site. */
    unverified:
      "I'd rather not guess at that one. Leave your number and {owner} will answer it personally, usually within one business day.",
    /** Nothing on the site answers the question. */
    unknown:
      "That isn't something this site covers, so I won't make up an answer. Leave your number and we'll get back to you.",
    /** The conversation hit its length cap. */
    tooLong:
      "This is a good point to talk to a person. Leave your number and we'll pick it up from here.",
    /** Network or server failure. */
    error: "Something went wrong on our end. You can still leave your number below.",
  },

  /* -----------------------------------------------------------------------
     Templates for the local answerer (lib/chat/local.ts), used when there is
     no model key or the model call fails. Every {token} is filled from
     content/services.ts or content/site.ts, never typed here.
     ----------------------------------------------------------------------- */
  local: {
    /** {name} {promise} {price} {url} */
    servicePrice: "{name}: {price}. {promise} Full details: {url}",
    /** {name} {timeline} {url} */
    serviceTimeline: "{name}: {timeline} Full details: {url}",
    /** {name} {promise} {forWhom} {url} */
    serviceAbout: "{name}: {promise} It's for {forWhom} Details and price: {url}",
    /** {area} */
    area: "We work with businesses across {area}. Most of the work happens remotely, so if you're outside that, ask anyway: leave your number and we'll tell you straight.",
    /** {owner} */
    handoff: "A real quote comes from {owner} after a free look at your business. Leave your name, business and number and we'll pick it up from there.",
  },

  /** Under the transcript, always visible. */
  disclaimer: "Automated answers from this site's content. Nothing here is a quote.",
} as const;
