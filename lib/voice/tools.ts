import { z } from "zod";

import { receptionist } from "@/content/receptionist";

import type { CalClient } from "./cal";

/**
 * The receptionist's two custom functions, called by Retell mid-call.
 *
 * Retell POSTs `{ name, call, args }` and reads back whatever JSON we return
 * as text for the voice model. So every reply carries `result`, a sentence
 * telling the model what to say, from `content/receptionist.ts`.
 *
 * The server, not the model, decides what is true: `check_slots` offers only
 * real Cal.com times, and `book` re-checks the chosen time against a fresh
 * slot list before booking, so a time the model made up or misheard is never
 * booked.
 */
export const toolCallSchema = z.object({
  name: z.string(),
  call: z
    .object({ call_id: z.string().optional(), from_number: z.string().optional() })
    .passthrough()
    .optional(),
  args: z.record(z.string(), z.unknown()).default({}),
});

export type ToolCall = z.infer<typeof toolCallSchema>;

const bookArgs = z.object({
  start: z.string().datetime({ offset: true }),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional(),
  business: z.string().trim().max(120).optional(),
  reason: z.string().trim().max(300).optional(),
});

export type ToolDeps = { cal: CalClient; timeZone: string; now: () => Date };

export type ToolReply = {
  result: string;
  slots?: { label: string; start: string }[];
  /** Set only when Cal.com confirmed the booking. The post-call summary reads it. */
  booked_start?: string;
  booking_uid?: string;
};

const SEARCH_DAYS = 7;
const OFFER = 3;

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** "Tuesday, October 20 at 2:30 PM", in the booking time zone. */
export function spokenTime(iso: string, timeZone: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(d);
  return `${day} at ${time}`;
}

/**
 * Up to three times: the first open time on each of the next few days, so the
 * caller hears a choice of days, then the earliest leftovers if there are
 * fewer than three days with openings.
 */
export function pickSlots(starts: string[], timeZone: string, count = OFFER): string[] {
  const dayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
  const picked: string[] = [];
  const days = new Set<string>();
  for (const start of starts) {
    if (picked.length >= count) break;
    if (days.has(dayOf(start))) continue;
    days.add(dayOf(start));
    picked.push(start);
  }
  for (const start of starts) {
    if (picked.length >= count) break;
    if (!picked.includes(start)) picked.push(start);
  }
  return picked.sort();
}

async function upcoming(deps: ToolDeps): Promise<string[]> {
  const now = deps.now();
  const end = new Date(now.getTime() + SEARCH_DAYS * 24 * 60 * 60 * 1000);
  const starts = await deps.cal.slots(now.toISOString(), end.toISOString(), deps.timeZone);
  return starts.filter((s) => new Date(s) > now);
}

export async function runTool(call: ToolCall, deps: ToolDeps): Promise<ToolReply> {
  const replies = receptionist.toolReplies;

  if (call.name === receptionist.tools.checkSlots.name) {
    const picked = pickSlots(await upcoming(deps), deps.timeZone);
    if (!picked.length) return { result: replies.noSlots, slots: [] };
    const slots = picked.map((start) => ({ label: spokenTime(start, deps.timeZone), start }));
    return { result: fill(replies.slots, { slots: slots.map((s) => s.label).join("; ") }), slots };
  }

  if (call.name === receptionist.tools.book.name) {
    const parsed = bookArgs.safeParse(call.args);
    if (!parsed.success) return { result: replies.badRequest };
    const args = parsed.data;
    const start = new Date(args.start).toISOString();

    if (!(await upcoming(deps)).includes(start)) return { result: replies.slotGone };

    const phone = args.phone || call.call?.from_number;
    const notes = [
      args.business ? `${args.business}: ` : "",
      args.reason || receptionist.sms.noReason,
      phone ? ` (callback ${phone})` : "",
      call.call?.call_id ? ` [phone assistant, call ${call.call.call_id}]` : "",
    ].join("");
    const booking = await deps.cal.book({ start, name: args.name, phone, timeZone: deps.timeZone, notes });
    if (!booking.ok) return { result: replies.failed };
    return {
      result: fill(replies.booked, { when: spokenTime(booking.start, deps.timeZone) }),
      booked_start: booking.start,
      booking_uid: booking.uid,
    };
  }

  return { result: replies.badRequest };
}
