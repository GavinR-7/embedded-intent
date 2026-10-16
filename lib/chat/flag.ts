/**
 * Whether the site chat is on.
 *
 *   CHAT_ENABLED=1   on
 *   CHAT_ENABLED=0   off
 *   unset            on in Vercel preview deployments, off everywhere else
 *
 * The unset default is what lets a PR preview show the chat without anyone
 * touching project settings, while production stays off until someone sets
 * CHAT_ENABLED=1 on purpose. Read on the server only: the layout decides
 * whether to render the widget, and the route returns 404 when it is off.
 */
export function chatEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const flag = env.CHAT_ENABLED?.trim();
  if (flag === "1") return true;
  if (flag === "0") return false;
  return env.VERCEL_ENV === "preview";
}
