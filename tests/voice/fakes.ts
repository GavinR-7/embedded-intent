import type { BookingInput, CalClient } from "@/lib/voice/cal";
import { signRetell } from "@/lib/voice/signature";

export const KEY = "test-retell-key";
export const NOW = new Date("2026-10-19T13:00:00Z"); // Monday 9:00 AM ET

export const ENV = {
  RECEPTIONIST_ENABLED: "1",
  RETELL_API_KEY: KEY,
  CAL_USERNAME: "gavin",
  CAL_EVENT_SLUG: "intro-15",
  TWILIO_ACCOUNT_SID: "AC_test",
  TWILIO_AUTH_TOKEN: "test-token",
  TWILIO_FROM_NUMBER: "+16312403073",
  RECEPTIONIST_NOTIFY_TO: "+15165550100",
  BOOKING_TIMEZONE: "America/New_York",
};

/** Open intro-call times: two on Monday, two on Tuesday, one on Wednesday. */
export const OPEN = [
  "2026-10-19T15:00:00.000Z",
  "2026-10-19T18:30:00.000Z",
  "2026-10-20T14:00:00.000Z",
  "2026-10-20T19:00:00.000Z",
  "2026-10-21T17:30:00.000Z",
];

/** A Cal.com stand-in: booking a time removes it from the open list. */
export function fakeCal(open: string[] = [...OPEN]) {
  const bookings: BookingInput[] = [];
  const cal: CalClient = {
    async slots(start, end) {
      return open.filter((s) => s >= start && s <= end);
    },
    async book(input) {
      const i = open.indexOf(input.start);
      if (i < 0) return { ok: false, status: 400, message: "slot taken" };
      open.splice(i, 1);
      bookings.push(input);
      return { ok: true, uid: `bk_${bookings.length}`, start: input.start };
    },
  };
  return { cal, bookings, open };
}

export function retellRequest(path: string, payload: unknown, opts: { key?: string; at?: number; signature?: string | null } = {}) {
  const body = JSON.stringify(payload);
  const headers = new Headers({ "content-type": "application/json" });
  const signature = opts.signature === undefined ? signRetell(body, opts.key ?? KEY, opts.at ?? NOW.getTime()) : opts.signature;
  if (signature) headers.set("x-retell-signature", signature);
  return new Request(`https://embeddedintent.com/api/voice/${path}`, { method: "POST", headers, body });
}
