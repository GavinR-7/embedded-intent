import { receptionist } from "@/content/receptionist";

import { createCalClient, type CalClient } from "./cal";
import { readVoiceConfig, receptionistEnabled, type VoiceConfig } from "./config";
import { SIGNATURE_HEADER, verifyRetell } from "./signature";
import { createDryRunSendSms, createSendSms, type SendSms } from "./sms";
import { formatSummary, type RetellCall } from "./summary";
import { runTool, toolCallSchema } from "./tools";

/**
 * The two webhooks, as plain Request → Response functions so tests and the
 * dry run drive them exactly as Retell would. The route files only wire these
 * to `process.env`.
 *
 * Order on every request: flag (404) → config (503, names what's missing) →
 * signature (401) → body (400) → work. Nothing reaches Cal.com or Twilio
 * without a valid Retell signature.
 */
export type VoiceDeps = {
  env: Record<string, string | undefined>;
  now: () => Date;
  /** Overrides for tests and the dry run; built from config when absent. */
  cal?: CalClient;
  sendSms?: SendSms;
  seen?: SeenCalls;
  log?: (line: string) => void;
};

/**
 * Retell retries a webhook up to three times when it doesn't get a 2xx in
 * ten seconds, so the post-call handler remembers call IDs it has texted
 * about. In memory: a retry that lands on a different serverless instance can
 * still send a second text. That costs one duplicate text to Gavin, not to a
 * caller, so it isn't worth a database yet (BUILD_NOTES.md).
 */
export class SeenCalls {
  private readonly ids = new Map<string, number>();
  constructor(private readonly ttlMs = 24 * 60 * 60 * 1000) {}
  /** True the first time an ID is claimed within the TTL. */
  claim(id: string, nowMs: number): boolean {
    for (const [key, at] of this.ids) if (nowMs - at > this.ttlMs) this.ids.delete(key);
    if (this.ids.has(id)) return false;
    this.ids.set(id, nowMs);
    return true;
  }
}

const sharedSeen = new SeenCalls();

type Ready = { config: VoiceConfig; body: string };

async function gate(request: Request, deps: VoiceDeps): Promise<Response | Ready> {
  if (!receptionistEnabled(deps.env)) return new Response("Not found", { status: 404 });
  const read = readVoiceConfig(deps.env);
  if (!read.ok) {
    (deps.log ?? console.error)(`receptionist: missing config ${read.missing.join(", ")}`);
    return Response.json({ ok: false, error: "receptionist not configured" }, { status: 503 });
  }
  const body = await request.text();
  if (!verifyRetell(body, request.headers.get(SIGNATURE_HEADER), read.config.retellApiKey, deps.now().getTime())) {
    return Response.json({ ok: false, error: "bad signature" }, { status: 401 });
  }
  return { config: read.config, body };
}

function json(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

export async function handleTools(request: Request, deps: VoiceDeps): Promise<Response> {
  const ready = await gate(request, deps);
  if (ready instanceof Response) return ready;
  const parsed = toolCallSchema.safeParse(json(ready.body));
  if (!parsed.success) return Response.json({ ok: false, error: "bad request" }, { status: 400 });
  const cal = deps.cal ?? createCalClient(ready.config.cal);
  try {
    return Response.json(await runTool(parsed.data, { cal, timeZone: ready.config.timeZone, now: deps.now }));
  } catch (error) {
    // Cal.com down or slow: tell the model to take a message rather than
    // leaving the caller in silence. 200, because Retell reads the body either way.
    (deps.log ?? console.error)(`receptionist: tool ${parsed.data.name} failed: ${String(error)}`);
    return Response.json({ result: receptionist.toolReplies.failed });
  }
}

export async function handlePostCall(request: Request, deps: VoiceDeps): Promise<Response> {
  const ready = await gate(request, deps);
  if (ready instanceof Response) return ready;
  const event = json(ready.body) as { event?: string; call?: RetellCall } | undefined;
  if (!event?.event || !event.call?.call_id) return Response.json({ ok: false, error: "bad request" }, { status: 400 });

  // call_analyzed carries the transcript and the analysis; the earlier events
  // (call_started, call_ended) are acknowledged and ignored, so it's one text per call.
  if (event.event !== "call_analyzed" || event.call.direction === "outbound") {
    return new Response(null, { status: 204 });
  }
  const seen = deps.seen ?? sharedSeen;
  if (!seen.claim(event.call.call_id, deps.now().getTime())) return Response.json({ ok: true, duplicate: true });

  const text = formatSummary(event.call, { timeZone: ready.config.timeZone, callLink: ready.config.callLink });
  const send =
    deps.sendSms ??
    (ready.config.dryRun ? createDryRunSendSms(deps.log) : createSendSms(ready.config.twilio));
  const sent = await send(ready.config.notifyTo, text);
  if (!sent.ok) (deps.log ?? console.error)(`receptionist: summary SMS failed, Twilio HTTP ${sent.status}`);
  // 200 even when Twilio refused: a Retell retry would not fix it, and it would
  // be deduped anyway. The failure is in the log.
  return Response.json({ ok: sent.ok });
}
