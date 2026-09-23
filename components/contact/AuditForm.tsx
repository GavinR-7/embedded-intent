"use client";

import { useRef, useState } from "react";

import { audit } from "@/content/audit";
import { site } from "@/content/site";

type Status = "idle" | "submitting" | "success" | "error";

const { form } = audit;

const fieldClass =
  "w-full rounded-field border border-line-interactive bg-void px-3.5 py-2.5 text-body text-ink placeholder:text-ink-subtle transition-colors duration-[var(--duration-fast)] focus:border-signal";

function Field({
  id,
  label,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline gap-2 text-label text-ink">
        {label}
        <span className="text-eyebrow font-mono uppercase text-ink-subtle">
          {required ? form.requiredNote : form.optionalNote}
        </span>
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-label text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The audit request form.
 *
 * Validation is server-side (see lib/auditRequest.ts); this does not ship zod.
 * Native `required` and `type="email"` give immediate feedback, and anything
 * the server rejects comes back as field-keyed messages rendered beside the
 * input.
 *
 * Three real states, no silent failures: submitting disables the button,
 * success replaces the form, and failure keeps every value the visitor typed
 * on screen so nothing has to be retyped.
 */
export function AuditForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrors({});
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      business: String(formData.get("business") ?? ""),
      website: String(formData.get("website") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      companyUrl: String(formData.get("companyUrl") ?? ""),
      interests: formData.getAll("interests").map(String),
    };

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        setStatus("success");
        return;
      }

      setStatus("error");
      if (result.errors) setErrors(result.errors);
      if (result.message) setMessage(result.message);
      // Move the announcement into view for anyone who submitted from the
      // bottom of a long form.
      errorSummaryRef.current?.scrollIntoView({ block: "nearest" });
    } catch {
      // Network failure — the request never reached the server.
      setStatus("error");
      setMessage(form.errorBody);
    }
  }

  if (status === "success") {
    return (
      <div
        // Announced to screen readers, since the form it replaced is gone.
        role="status"
        className="rounded-card border border-signal/40 bg-signal-wash/40 p-7 sm:p-9"
      >
        <h2 className="text-h2 text-ink">{form.successHeading}</h2>
        <p className="mt-5 max-w-prose-tight text-lead text-ink-muted">
          {form.successBody}
        </p>
        <p className="mt-6 border-t border-line pt-5 font-mono text-eyebrow uppercase text-signal">
          {site.responseCommitment}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div ref={errorSummaryRef} aria-live="polite">
        {status === "error" && (
          <div className="rounded-card border border-alert/50 bg-surface p-5">
            <p className="text-label font-medium text-alert">{form.errorHeading}</p>
            <p className="mt-2 text-label text-ink-muted">
              {message ?? form.errorBody}
            </p>
            {site.email && (
              <a
                href={`mailto:${site.email}`}
                className="mt-3 inline-block rounded-sm text-label text-signal underline underline-offset-4"
              >
                {site.email}
              </a>
            )}
          </div>
        )}
      </div>

      <Field id="name" label="Full name" required error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={fieldClass}
        />
      </Field>

      <Field id="business" label="Business name" error={errors.business}>
        <input
          id="business"
          name="business"
          type="text"
          autoComplete="organization"
          className={fieldClass}
        />
      </Field>

      <Field id="website" label="Website" error={errors.website}>
        <input
          id="website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="yourbusiness.com"
          className={fieldClass}
        />
      </Field>

      <Field id="email" label="Email" required error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={fieldClass}
        />
      </Field>

      <Field id="phone" label="Phone" error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={fieldClass}
        />
      </Field>

      {/* A real fieldset/legend, so the group is announced as one question
          rather than seven unrelated checkboxes. */}
      <fieldset>
        <legend className="text-label text-ink">{form.interestLegend}</legend>
        <p className="mt-1 text-label text-ink-subtle">{form.interestHint}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {form.interests.map((interest) => (
            <label
              key={interest.id}
              className="lift group cursor-pointer rounded-field border border-line px-3.5 py-2 text-label text-ink-muted has-checked:border-signal has-checked:bg-signal-wash has-checked:text-signal"
            >
              <input
                type="checkbox"
                name="interests"
                value={interest.id}
                className="sr-only"
              />
              {interest.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="message" label="What's going on?" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Whatever's costing you jobs. A sentence is fine."
          className={`${fieldClass} resize-y`}
        />
      </Field>

      {/*
        Honeypot. Hidden from sight and from assistive tech, and taken out of
        the tab order, so no real person ever reaches it. Bots fill every input
        they can find, and a filled one is dropped server-side.
      */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="companyUrl">Company URL</label>
        <input id="companyUrl" name="companyUrl" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-field bg-signal px-5 py-3 text-label font-semibold text-void transition-colors duration-[var(--duration-fast)] ease-precise hover:bg-signal-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? form.submittingLabel : form.submitLabel}
        </button>
        <p className="mt-4 text-label text-ink-subtle">{site.responseCommitment}</p>
      </div>
    </form>
  );
}
