import { z } from "zod";

const e164 = z.string().regex(/^\+[1-9]\d{7,14}$/, "must be E.164, e.g. +16315550123");

/**
 * One entry per client, keyed by the Twilio number that client's calls are
 * forwarded to. Each client has its own Twilio subaccount (own SID and token),
 * so a token leak or a compliance problem stays with that client.
 */
export const clientSchema = z.object({
  /** Business name, as registered with the carrier. Used in the texts. */
  name: z.string().min(1),
  /** The Twilio number (E.164) calls are forwarded to and texts are sent from. */
  twilioNumber: e164,
  /** Where caller replies are forwarded: the owner's own cell. */
  ownerPhone: e164,
  accountSid: z.string().startsWith("AC"),
  authToken: z.string().min(1),
  /** Optional wording override. Must keep the opt-out line (carrier rule). */
  template: z
    .string()
    .refine((t) => /\bSTOP\b/.test(t), "template must include STOP opt-out wording")
    .optional(),
  /** Public phone number to show in HELP replies. Optional. */
  helpContact: z.string().optional(),
});

export type TextbackClient = z.infer<typeof clientSchema>;

export function defaultTemplate(name: string): string {
  return `Hi, this is ${name}. Sorry we missed your call! What can we help with? We'll text you back shortly. Reply STOP to opt out.`;
}

export function missedCallText(client: TextbackClient): string {
  return client.template ?? defaultTemplate(client.name);
}

export function helpText(client: TextbackClient): string {
  const contact = client.helpContact ? ` Contact: ${client.helpContact}.` : "";
  return `${client.name}: we text people who called us. Msg&data rates may apply.${contact} Reply STOP to opt out.`;
}

/**
 * Reads TEXTBACK_CLIENTS: a JSON array of client objects. It lives in an
 * environment variable because it contains auth tokens. Returns [] when unset
 * or malformed so a bad config fails closed (every webhook answers 403).
 */
export function loadClients(raw = process.env.TEXTBACK_CLIENTS): TextbackClient[] {
  if (!raw) return [];
  try {
    const parsed = z.array(clientSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function findClient(clients: TextbackClient[], twilioNumber: string): TextbackClient | undefined {
  return clients.find((c) => c.twilioNumber === twilioNumber);
}
