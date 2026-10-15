/**
 * Cal.com v2, the two calls the receptionist needs, with fetch (no SDK).
 *
 * Both are public endpoints addressed by username + event slug, so a free
 * Cal.com account works and the API key is optional (checked 2026-10-15 against
 * https://cal.com/docs/agents). A key, when set, is sent anyway: it attributes
 * the booking to the account and lifts the anonymous rate limit.
 *
 *   GET  /v2/slots     cal-api-version 2024-09-04
 *   POST /v2/bookings  cal-api-version 2026-02-25
 *
 * `fetchImpl` is injectable so tests and the dry run never touch the network.
 */
const BASE = "https://api.cal.com/v2";

export type CalSettings = { username: string; eventSlug: string; apiKey?: string };

export type BookingInput = {
  start: string;
  name: string;
  phone?: string;
  timeZone: string;
  notes: string;
};

export type BookResult =
  | { ok: true; uid: string; start: string }
  | { ok: false; status: number; message: string };

export type CalClient = {
  /** Open slot start times (UTC ISO), earliest first. */
  slots(startIso: string, endIso: string, timeZone: string): Promise<string[]>;
  book(input: BookingInput): Promise<BookResult>;
};

export function createCalClient(settings: CalSettings, fetchImpl: typeof fetch = fetch): CalClient {
  const headers = (version: string): Record<string, string> => ({
    "cal-api-version": version,
    "Content-Type": "application/json",
    ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
  });

  return {
    async slots(startIso, endIso, timeZone) {
      const query = new URLSearchParams({
        start: startIso,
        end: endIso,
        timeZone,
        username: settings.username,
        eventTypeSlug: settings.eventSlug,
      });
      const res = await fetchImpl(`${BASE}/slots?${query}`, { headers: headers("2024-09-04") });
      if (!res.ok) throw new Error(`cal.com slots: HTTP ${res.status}`);
      const json = (await res.json()) as { data?: Record<string, { start?: string }[]> };
      return Object.values(json.data ?? {})
        .flat()
        .map((slot) => slot.start)
        .filter((start): start is string => typeof start === "string")
        .map((start) => new Date(start).toISOString())
        .sort();
    },

    async book(input) {
      const res = await fetchImpl(`${BASE}/bookings`, {
        method: "POST",
        headers: headers("2026-02-25"),
        body: JSON.stringify({
          start: input.start,
          username: settings.username,
          eventTypeSlug: settings.eventSlug,
          attendee: {
            name: input.name,
            timeZone: input.timeZone,
            ...(input.phone ? { phoneNumber: input.phone } : {}),
          },
          bookingFieldsResponses: { notes: input.notes },
        }),
      });
      let json: { data?: { uid?: string; start?: string }; error?: { message?: string } } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        // Non-JSON error body: the status is enough.
      }
      if (res.ok && json.data?.uid && json.data.start) {
        return { ok: true, uid: json.data.uid, start: new Date(json.data.start).toISOString() };
      }
      return { ok: false, status: res.status, message: json.error?.message ?? `HTTP ${res.status}` };
    },
  };
}
