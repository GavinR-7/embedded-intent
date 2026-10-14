import {
  findClient,
  helpText,
  loadClients,
  missedCallText,
  type TextbackClient,
} from "./config.ts";
import { isValidTwilioSignature } from "./signature.ts";
import { defaultStore, type TextbackStore } from "./store.ts";
import { createSendSms, type SendSms } from "./twilio.ts";

export type TextbackKind = "voice" | "status" | "sms";

export interface TextbackDeps {
  clients: () => TextbackClient[];
  sendSms: SendSms;
  store: TextbackStore;
  now: () => number;
  /** Public origin Twilio calls, e.g. https://embeddedintent.com. Optional. */
  publicOrigin?: string;
  /** One auto-text per caller per window. */
  dedupeWindowMs: number;
}

export function defaultDeps(): TextbackDeps {
  return {
    clients: () => loadClients(),
    sendSms: createSendSms(),
    store: defaultStore,
    now: () => Date.now(),
    publicOrigin: process.env.TEXTBACK_PUBLIC_ORIGIN,
    dedupeWindowMs: 24 * 60 * 60 * 1000,
  };
}

const STOP_WORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START_WORDS = new Set(["START", "YES", "UNSTOP"]);
const HELP_WORDS = new Set(["HELP", "INFO"]);

const xml = (inner: string) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The URL Twilio signed. Behind Vercel the request URL may be internal, so
 * prefer the configured public origin, then the forwarded headers.
 */
function signedUrl(request: Request, publicOrigin?: string): string {
  const u = new URL(request.url);
  if (publicOrigin) return `${publicOrigin.replace(/\/$/, "")}${u.pathname}${u.search}`;
  const proto = request.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? u.host;
  return `${proto}://${host}${u.pathname}${u.search}`;
}

async function readParams(request: Request): Promise<Record<string, string> | null> {
  try {
    const form = new URLSearchParams(await request.text());
    return Object.fromEntries(form.entries());
  } catch {
    return null;
  }
}

async function textMissedCall(client: TextbackClient, caller: string, deps: TextbackDeps) {
  const { store, now } = deps;
  if (store.isOptedOut(client.twilioNumber, caller)) return;
  if (store.wasTextedRecently(client.twilioNumber, caller, now(), deps.dedupeWindowMs)) return;
  // Mark before sending: a retried webhook must not double-text.
  store.markTexted(client.twilioNumber, caller, now());
  const result = await deps.sendSms(client, caller, missedCallText(client));
  if (!result.ok && result.code === 21610) store.setOptedOut(client.twilioNumber, caller, true);
}

/**
 * One entry point for all three webhooks. Order matters: parse, find the
 * client by the number Twilio says it called, verify the signature with THAT
 * client's token, and only then act. Anything that fails answers 403 with no
 * detail.
 */
export async function handleTextback(
  kind: TextbackKind,
  request: Request,
  deps: TextbackDeps = defaultDeps(),
): Promise<Response> {
  const forbidden = () => new Response("Forbidden", { status: 403 });

  const params = await readParams(request);
  if (!params) return new Response("Bad request", { status: 400 });

  // For inbound calls and texts, "To" is our Twilio number.
  const client = findClient(deps.clients(), params.To ?? "");
  if (!client) return forbidden();

  const url = signedUrl(request, deps.publicOrigin);
  if (!isValidTwilioSignature(client.authToken, request.headers.get("x-twilio-signature"), url, params)) {
    return forbidden();
  }

  const from = params.From ?? "";
  if (!/^\+[1-9]\d{7,14}$/.test(from)) return new Response("Bad request", { status: 400 });

  if (kind === "voice") {
    // A call only reaches this number when the owner's phone forwarded it
    // unanswered. Text the caller, then end the call without answering.
    await textMissedCall(client, from, deps);
    return xml(`<Reject reason="busy"/>`);
  }

  if (kind === "status") {
    // Call-status callback, for setups where Twilio rings first.
    if (["no-answer", "busy", "failed"].includes(params.CallStatus ?? "")) {
      await textMissedCall(client, from, deps);
    }
    return xml("");
  }

  // kind === "sms": a reply from a caller.
  const word = (params.Body ?? "").trim().toUpperCase();
  if (STOP_WORDS.has(word)) {
    // Twilio's own opt-out handling sends the confirmation; we only record it.
    deps.store.setOptedOut(client.twilioNumber, from, true);
    return xml("");
  }
  if (START_WORDS.has(word)) {
    deps.store.setOptedOut(client.twilioNumber, from, false);
    return xml("");
  }
  if (HELP_WORDS.has(word)) {
    return xml(`<Message>${escapeXml(helpText(client))}</Message>`);
  }

  // A real reply: pass it to the owner, who answers from their own phone.
  const body = (params.Body ?? "").slice(0, 600);
  await deps.sendSms(client, client.ownerPhone, `Reply from ${from}: ${body}`);
  return xml("");
}
