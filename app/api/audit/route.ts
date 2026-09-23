import { Resend } from "resend";

import {
  auditRequestSchema,
  collectFieldErrors,
  formatAuditEmail,
  isTooFast,
} from "@/lib/auditRequest";

/**
 * Audit request endpoint.
 *
 * Route Handlers are not cached for POST, and this one must never be
 * prerendered — it reads environment variables and sends mail.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const parsed = auditRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: collectFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  /*
   * Honeypot.
   *
   * Returns success rather than an error on purpose. Telling a bot it was
   * caught just teaches whoever wrote it which field to skip next time; a
   * 200 makes a blocked submission indistinguishable from a delivered one.
   * Nothing is sent.
   */
  if (data.companyUrl && data.companyUrl.trim() !== "") {
    return Response.json({ ok: true });
  }

  /*
   * Time trap, with the same silent 200 and for the same reason: a distinct
   * response would tell whoever wrote the bot exactly which check to defeat.
   */
  if (isTooFast(data)) {
    return Response.json({ ok: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.AUDIT_TO_EMAIL;
  const from = process.env.AUDIT_FROM_EMAIL;

  /*
   * Fail loudly on missing configuration.
   *
   * The tempting alternative — log a warning and return success — would mean
   * a misconfigured deploy silently swallows every lead while showing the
   * visitor a thank-you page. That is the worst possible failure for this
   * form, so an unconfigured server is an error, and the visitor is told to
   * email directly instead.
   */
  if (!apiKey || !to || !from) {
    console.error(
      "[audit] Missing configuration. Set RESEND_API_KEY, AUDIT_TO_EMAIL and AUDIT_FROM_EMAIL.",
    );
    return Response.json(
      { ok: false, message: "The form is not configured to send yet." },
      { status: 500 },
    );
  }

  const { subject, text } = formatAuditEmail(data);

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [to],
      subject,
      text,
      // So hitting reply in the inbox goes to the person who filled the form.
      replyTo: data.email,
    });

    // The SDK reports delivery failures in the payload rather than throwing,
    // so this has to be checked explicitly or a rejected send looks like a
    // success.
    if (result.error) {
      console.error("[audit] Resend rejected the send:", result.error);
      return Response.json(
        { ok: false, message: "The email service rejected the message." },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[audit] Send threw:", error);
    return Response.json(
      { ok: false, message: "Could not reach the email service." },
      { status: 502 },
    );
  }
}
