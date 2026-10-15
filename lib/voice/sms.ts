import type { VoiceConfig } from "./config";

/**
 * One SMS through Twilio's REST API with fetch (no SDK). The same shape as the
 * missed-call text-back's sender on its branch; kept separate so this PR
 * doesn't depend on that one being merged first.
 */
export type SendSms = (to: string, body: string) => Promise<{ ok: boolean; status: number }>;

export function createSendSms(twilio: VoiceConfig["twilio"], fetchImpl: typeof fetch = fetch): SendSms {
  return async (to, body) => {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
    const auth = Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64");
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: twilio.from, Body: body }),
    });
    return { ok: res.ok, status: res.status };
  };
}

/** RECEPTIONIST_DRY_RUN=1: log the text (it only ever goes to Gavin) instead of sending it. */
export function createDryRunSendSms(log: (line: string) => void = console.info): SendSms {
  return async (to, body) => {
    log(`receptionist dry-run: would text ...${to.slice(-4)} (${body.length} chars): ${body}`);
    return { ok: true, status: 200 };
  };
}
