/**
 * Copy for the three category hero illustrations.
 *
 * ---------------------------------------------------------------------------
 * Everything in this file is an ILLUSTRATION and has to stay readable as one.
 *
 * These visuals demonstrate what a category does. They are not screenshots, not
 * telemetry and not case studies, and every label here is chosen so that nobody
 * can mistake them for one:
 *
 *   - no real business names, ours or anyone else's. The mock website belongs
 *     to "Your business"; the competitors in the map pack are A, B and C.
 *   - no counts, no percentages, no timings presented as data. The star ratings
 *     in the map pack are drawn as filled shapes, not printed as numbers, for
 *     exactly that reason.
 *   - no client conversations. The phone thread is written from scratch.
 *   - every one of the three carries a caption that says so, in the markup, not
 *     in a comment.
 *
 * That is the same rule content/work.ts enforces for results, applied to
 * pictures: a figure only goes on this site as a measurement if it has been
 * measured and has a source. None of these have, so none of them is one.
 * ---------------------------------------------------------------------------
 */

export type PhoneMessage = {
  /**
   * `system` is the grey status line, `out` is the business (right, accent),
   * `in` is the customer (left).
   */
  side: "system" | "out" | "in";
  text: string;
  /** Show typing dots before this message arrives. */
  typing?: boolean;
};

export const heroVisuals = {
  /**
   * /websites — the x-ray lens.
   *
   * A finished page on top, the decisions underneath it, and a lens that shows
   * one through the other.
   */
  websites: {
    caption: "Illustration — a finished page, and the layout underneath it.",
    /** Announced instead of the drawing, which is decorative. */
    alt: "A mock website page with a circular lens moving across it, revealing the wireframe, column grid and spacing measurements it was built on.",
    mock: {
      brand: "Your business",
      nav: ["Services", "Work", "Contact"],
      heading: "Fast, local, booked online.",
      cta: "Get a quote",
      cards: ["Repairs", "Installs", "Maintenance"],
    },
    /** What the blueprint layer calls out. Short enough to read at 11px. */
    blueprint: {
      grid: "12 col",
      container: "max-w 72rem",
      gap: "32px",
      type: "h1 · 68 / 1.05",
      cards: "3 up · gap 24px",
      nav: "nav · 64px",
    },
  },

  /**
   * /get-found — the map pack.
   *
   * A stylized map with a results list beside it. "Your business" starts fourth
   * and climbs to first as its reviews come in. The map is drawn, not traced:
   * the roads are four straight lines and there is no real place anywhere in it.
   */
  getFound: {
    caption: "Illustration — example listings, not a real search or real results.",
    alt: "A stylized map with four pins beside a list of local results, in which a business labeled 'Your business' climbs from fourth place to first as its review rating rises.",
    query: "hvac repair near me",
    heading: "Local results",
    youLabel: "Your business",
    competitors: ["Competitor A", "Competitor B", "Competitor C"],
  },

  /**
   * /ai-automation — the phone thread.
   *
   * A missed call after hours, answered and booked without anyone touching it.
   * Written from scratch; no part of it is a real conversation.
   */
  aiAutomation: {
    caption: "Illustration — an example thread, not a real conversation.",
    alt: "A phone showing a text thread: a missed call at 8:41pm is answered automatically, the customer describes the problem, and the job is booked for Thursday at 9am.",
    header: "Your business",
    messages: [
      { side: "system", text: "Missed call · 8:41pm" },
      {
        side: "out",
        text: "Sorry we missed you — what can we help with?",
        typing: true,
      },
      { side: "in", text: "AC stopped blowing cold. Can someone come tomorrow?", typing: true },
      { side: "out", text: "Yes. We have 9am or 2pm — which works?", typing: true },
      { side: "in", text: "9am please", typing: true },
      { side: "out", text: "Booked: Thu 9am ✓", typing: true },
    ] satisfies PhoneMessage[],
  },
} as const;
