import { receptionist } from "@/content/receptionist";

/**
 * The one text Gavin gets after a call: who, which number, why, booked or
 * not, and where to find the call. At most 300 characters (two SMS segments)
 * and plain GSM-7 characters only, because one curly quote or em dash would
 * switch the whole message to UCS-2 and halve what fits in a segment.
 */
export const MAX_SMS = 300;

/** The parts of Retell's call object the summary reads. Everything is optional: a hang-up has almost nothing. */
export type RetellCall = {
  call_id: string;
  direction?: string;
  from_number?: string;
  to_number?: string;
  start_timestamp?: number;
  duration_ms?: number;
  disconnection_reason?: string;
  transcript_with_tool_calls?: Array<{
    role: string;
    tool_call_id?: string;
    name?: string;
    arguments?: string;
    content?: string;
  }>;
  call_analysis?: {
    call_summary?: string;
    in_voicemail?: boolean;
    custom_analysis_data?: Record<string, unknown>;
  };
};

export type CallFacts = {
  name: string | null;
  business: string | null;
  reason: string | null;
  bookedStart: string | null;
};

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function parse(json: string | undefined): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(json ?? "");
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Facts from the call, most trustworthy source first: what the `book` tool
 * actually booked (our own reply, recorded in the transcript), then the
 * arguments the agent passed to `book`, then Retell's post-call analysis
 * fields (name / business / reason, configured in the agent).
 */
export function callFacts(call: RetellCall): CallFacts {
  const entries = call.transcript_with_tool_calls ?? [];
  let bookArgs: Record<string, unknown> = {};
  let bookedStart: string | null = null;
  for (const entry of entries) {
    if (entry.role !== "tool_call_invocation" || entry.name !== receptionist.tools.book.name) continue;
    const result = entries.find((e) => e.role === "tool_call_result" && e.tool_call_id === entry.tool_call_id);
    const booked = text(parse(result?.content).booked_start);
    bookArgs = parse(entry.arguments);
    if (booked) {
      bookedStart = booked;
      break;
    }
  }
  const analysis = call.call_analysis?.custom_analysis_data ?? {};
  return {
    name: text(bookArgs.name) ?? text(analysis.caller_name),
    business: text(bookArgs.business) ?? text(analysis.business),
    reason: text(bookArgs.reason) ?? text(analysis.reason) ?? text(call.call_analysis?.call_summary),
    bookedStart,
  };
}

const GSM = /[^A-Za-z0-9 \n\r@$_!"#%&'()*+,\-./:;<=>?]/g;

/** Straight quotes and plain dashes, then drop anything outside basic GSM-7. */
export function plain(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(GSM, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Tue Oct 20 2:30 PM" */
function shortTime(iso: string, timeZone: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(d);
  return `${day} ${time}`.replace(",", "");
}

export function formatSummary(call: RetellCall, opts: { timeZone: string; callLink?: string }): string {
  const s = receptionist.sms;
  const facts = callFacts(call);
  const who = [facts.name ?? s.unknownName, facts.business ? `(${facts.business})` : ""].filter(Boolean).join(" ");
  const status = facts.bookedStart
    ? s.booked.replace("{when}", shortTime(facts.bookedStart, opts.timeZone))
    : call.call_analysis?.in_voicemail
      ? s.voicemail
      : s.notBooked;
  const link = opts.callLink ? opts.callLink.replace("{call_id}", call.call_id) : `${s.call} ${call.call_id}`;

  const head = plain(`${s.prefix}: ${who}, ${call.from_number ?? "no caller ID"}. ${status}.`);
  const tail = plain(link);
  // The reason is the only part that gets cut; it has whatever room is left.
  const room = MAX_SMS - head.length - tail.length - 2;
  let reason = plain(facts.reason ?? s.noReason);
  if (reason.length > room) reason = `${reason.slice(0, Math.max(0, room - 3)).trimEnd()}...`;
  return [head, reason, tail].filter(Boolean).join(" ").slice(0, MAX_SMS);
}
