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

/**
 * The known interest ids, as a zod enum.
 *
 * `audit` is `as const`, so `interests` is a tuple of literals and this enum
 * is derived from it — adding an option to the content module extends what the
 * API accepts, with no second list to update. Anything else is rejected rather
 * than quietly filtered, so a malformed client is an error rather than a
 * submission that silently loses a field.
 */
const INTEREST_IDS = audit.form.interests.map((interest) => interest.id) as [
  string,
  ...string[],
];

const interestEnum = z.enum(INTEREST_IDS);

/**
 * How long a human plausibly needs to fill this in.
 *
 * Paired with `renderedAt` below. A bot that POSTs the instant the page loads
 * trips it; a person filling six fields cannot.
 */
export const MIN_FILL_MS = 3000;

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
    .array(interestEnum)
    // Capped at the number of options, so a payload cannot carry thousands of
    // repeated valid ids into the email body.
    .max(audit.form.interests.length)
    .default([]),

  message: optionalText(4000),

  /**
   * Honeypot. A real person never sees or fills this; bots fill every field
   * they find. Named to look worth filling in.
   */
  companyUrl: z.string().optional(),

  /**
   * Time trap. The page writes its render time into a hidden field; a
   * submission that arrives less than MIN_FILL_MS after it was rendered did
   * not come from someone typing.
   *
   * Coerced and optional rather than required: a missing or unparseable value
   * must not reject a real person whose browser did something unexpected. The
   * check below only fires on a value that is present and implausibly recent.
   */
  renderedAt: z.coerce.number().int().positive().optional(),
});

export type AuditRequest = z.infer<typeof auditRequestSchema>;

/**
 * True when the submission arrived impossibly fast after the form rendered.
 *
 * Kept as a separate check rather than a schema refinement, because the
 * response to it is the honeypot's silent 200 — not a validation error a bot
 * could learn from.
 */
export function isTooFast(data: AuditRequest, now = Date.now()): boolean {
  if (data.renderedAt === undefined) return false;
  const elapsed = now - data.renderedAt;
  // A negative elapsed means a clock skew between the visitor's machine and
  // the server. That is not evidence of a bot, so it is not treated as one.
  if (elapsed < 0) return false;
  return elapsed < MIN_FILL_MS;
}

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
