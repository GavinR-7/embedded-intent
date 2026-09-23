import { z } from "zod";

import { audit } from "@/content/audit";

/**
 * The audit request, validated server-side.
 *
 * This module is imported by the route handler only, never by the form. That
 * is deliberate: zod is ~13KB gzipped and validating in the browser would ship
 * it to every visitor to re-check what the server has to check anyway. The
 * form uses native HTML validation for immediate feedback and renders whatever
 * field errors the server returns.
 *
 * Never trust the client for this. Anything can POST to the endpoint.
 */

/* Widened to string[] deliberately. `audit` is `as const`, so these ids are
 * literal types — but the values arriving here came off the wire and are
 * plain strings. Comparing them against a literal union is a type error, and
 * the whole job of this line is to check untrusted input against the list. */
const INTEREST_IDS: string[] = audit.form.interests.map((interest) => interest.id);

/** Trim, then treat an empty string as absent. Browsers send "" for untouched
 *  optional inputs, and `""` is not a missing value to zod without this. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

export const auditRequestSchema = z.object({
  name: z.string().trim().min(1, "Please tell me your name.").max(120),

  business: optionalText(160),

  // Accepts "acme.com" as well as a full URL — asking a contractor to type
  // https:// is a good way to lose the submission.
  website: optionalText(200),

  email: z.string().trim().min(1, "I need an email to reply to.").pipe(
    z.email("That email address doesn't look right."),
  ),

  phone: optionalText(40),

  interests: z
    .array(z.string())
    .default([])
    .transform((values) => values.filter((value) => INTEREST_IDS.includes(value))),

  message: optionalText(4000),

  /**
   * Honeypot. A real person never sees or fills this; bots fill every field
   * they find. Named to look worth filling in.
   */
  companyUrl: z.string().optional(),
});

export type AuditRequest = z.infer<typeof auditRequestSchema>;

/** Field-keyed messages, shaped for the form to render beside each input. */
export type FieldErrors = Partial<Record<string, string>>;

export function collectFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    // First message per field wins — showing three complaints about one input
    // is noise.
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Turns a validated submission into the email the owner actually receives. */
export function formatAuditEmail(data: AuditRequest): {
  subject: string;
  text: string;
} {
  const labels = new Map<string, string>(
    audit.form.interests.map((i) => [i.id, i.label]),
  );
  const interests = data.interests.map((id) => labels.get(id) ?? id);

  const lines = [
    `Name:      ${data.name}`,
    `Email:     ${data.email}`,
    `Business:  ${data.business ?? "—"}`,
    `Website:   ${data.website ?? "—"}`,
    `Phone:     ${data.phone ?? "—"}`,
    `After:     ${interests.length > 0 ? interests.join(", ") : "—"}`,
    "",
    "Message:",
    data.message ?? "—",
  ];

  return {
    subject: `Audit request — ${data.name}${data.business ? ` (${data.business})` : ""}`,
    text: lines.join("\n"),
  };
}
