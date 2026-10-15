/**
 * The receptionist's environment. Names only in `.env.example`; values live in
 * Vercel. `readVoiceConfig` returns the list of missing names instead of
 * throwing, so a half-configured deploy answers 503 and says which, rather
 * than failing mid-call.
 */
export type VoiceConfig = {
  retellApiKey: string;
  cal: { username: string; eventSlug: string; apiKey?: string };
  twilio: { accountSid: string; authToken: string; from: string };
  /** Where the post-call summary goes. Gavin's own mobile, E.164. */
  notifyTo: string;
  timeZone: string;
  /** Optional link template for the SMS; `{call_id}` is replaced. */
  callLink?: string;
  /** RECEPTIONIST_DRY_RUN=1: log the summary text instead of sending it. */
  dryRun: boolean;
};

type Env = Record<string, string | undefined>;

/**
 * RECEPTIONIST_ENABLED=1 turns the two webhooks on. Anything else, including
 * unset, is off and the routes answer 404. Unlike the site chat there is no
 * preview default: a phone agent only ever talks to these routes after Gavin
 * points a Retell agent at them, and that is the moment to set the flag.
 */
export function receptionistEnabled(env: Env = process.env): boolean {
  return env.RECEPTIONIST_ENABLED?.trim() === "1";
}

const E164 = /^\+1\d{10}$/;

export function readVoiceConfig(env: Env = process.env): { ok: true; config: VoiceConfig } | { ok: false; missing: string[] } {
  const get = (name: string) => env[name]?.trim() || undefined;
  const required = [
    "RETELL_API_KEY",
    "CAL_USERNAME",
    "CAL_EVENT_SLUG",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
    "RECEPTIONIST_NOTIFY_TO",
  ] as const;
  const missing: string[] = required.filter((name) => !get(name));
  for (const name of ["TWILIO_FROM_NUMBER", "RECEPTIONIST_NOTIFY_TO"] as const) {
    const value = get(name);
    if (value && !E164.test(value)) missing.push(`${name} (not +1 and ten digits)`);
  }
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    config: {
      retellApiKey: get("RETELL_API_KEY")!,
      cal: { username: get("CAL_USERNAME")!, eventSlug: get("CAL_EVENT_SLUG")!, apiKey: get("CAL_API_KEY") },
      twilio: { accountSid: get("TWILIO_ACCOUNT_SID")!, authToken: get("TWILIO_AUTH_TOKEN")!, from: get("TWILIO_FROM_NUMBER")! },
      notifyTo: get("RECEPTIONIST_NOTIFY_TO")!,
      timeZone: get("BOOKING_TIMEZONE") ?? "America/New_York",
      callLink: get("RECEPTIONIST_CALL_LINK"),
      dryRun: get("RECEPTIONIST_DRY_RUN") === "1",
    },
  };
}
