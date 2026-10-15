import type { TextbackClient } from "./config.ts";

export type SendSms = (
  client: TextbackClient,
  to: string,
  body: string,
) => Promise<{ ok: boolean; status: number; code?: number }>;

/**
 * Sends an SMS through Twilio's REST API with fetch (no SDK, so no new
 * dependency). `fetchImpl` is injectable so tests never touch the network.
 */
export function createSendSms(fetchImpl: typeof fetch = fetch): SendSms {
  return async (client, to, body) => {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${client.accountSid}/Messages.json`;
    const auth = Buffer.from(`${client.accountSid}:${client.authToken}`).toString("base64");
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: client.twilioNumber, Body: body }),
    });
    if (res.ok) return { ok: true, status: res.status };
    // 21610 = recipient has opted out (STOP). Twilio refuses; that is correct.
    let code: number | undefined;
    try {
      code = ((await res.json()) as { code?: number }).code;
    } catch {
      // Non-JSON error body: status alone is enough.
    }
    return { ok: false, status: res.status, code };
  };
}

/** "…0123": enough to match a log line to a test call, not a whole number. */
export const lastFour = (phone: string) => `…${phone.slice(-4)}`;

/**
 * TEXTBACK_DRY_RUN=1: the whole webhook path runs (signature, dedupe, STOP)
 * but nothing goes to Twilio; each would-be text is logged instead. Used to
 * test on the live site before the carriers approve the campaign.
 */
export function createDryRunSendSms(log: (line: string) => void = console.info): SendSms {
  return async (client, to, body) => {
    log(`textback dry-run: would text ${lastFour(to)} from ${client.name} (${body.length} chars)`);
    return { ok: true, status: 200 };
  };
}

export function sendSmsFromEnv(env: Record<string, string | undefined> = process.env): SendSms {
  return env.TEXTBACK_DRY_RUN === "1" ? createDryRunSendSms() : createSendSms();
}
