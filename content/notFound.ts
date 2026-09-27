/**
 * The 404 page's copy.
 *
 * Here rather than in app/not-found.tsx for the same reason every other string
 * on this site is in content/: one place to change it, and no sentence hiding in
 * a component where nobody looking for copy would think to check.
 *
 * The tone is the rest of the site's. A 404 is a small failure on our side, not
 * the reader's mistake, and it should not be cute about it — the job of the page
 * is to get someone who was looking for something to the thing they wanted.
 */
export const notFoundPage = {
  eyebrow: "404",
  heading: "That page isn't here.",
  body: "It may have moved, or the link that brought you here may be wrong. Nothing you did caused this. Here is everything this site actually has.",
  /** Heading above the three category links. */
  routesHeading: "Where you probably wanted to go",
  homeLabel: "Back to the homepage",
} as const;
