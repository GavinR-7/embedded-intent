"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { chat } from "@/content/chat";
import { CHAT_HANDOFF_KEY, MAX_CHARS, type ChatHandoff } from "@/lib/chat/shared";

type Turn = { role: "user" | "assistant"; content: string };

const fieldClass =
  "w-full rounded-field border border-line-interactive bg-void px-3 py-2.5 text-body text-ink placeholder:text-ink-subtle focus:border-signal";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-field bg-signal px-4 text-label font-semibold text-void hover:bg-signal-dim disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-field border border-line-interactive px-4 text-label text-ink hover:border-signal";

/**
 * The site chat. One client island, rendered by the root layout only when
 * CHAT_ENABLED is on (lib/chat/flag.ts).
 *
 * Closed, it is one button. The panel and everything in it mount on open, so
 * a visitor who never taps it pays for one button's worth of DOM.
 *
 * No animation: the panel appears and disappears. That keeps it out of
 * MOTION.md's scope entirely and means reduced-motion needs nothing special.
 *
 * Handoff never submits anything. It writes name, business, phone and the
 * visitor's questions to sessionStorage and opens /contact, where the audit
 * form fills those fields in (components/contact/AuditForm.tsx). Storage
 * rather than a query string so a phone number never lands in a URL, a log
 * or an analytics page view.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  // Keep the newest message in view.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns, pending, showHandoff]);

  // Escape closes, and focus goes back to the button that opened it.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => openerRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    // After the panel unmounts, so the button exists again.
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;
    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setDraft("");
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; handoff?: boolean };
      if (!res.ok || !data.reply) throw new Error(String(res.status));
      setTurns([...next, { role: "assistant", content: data.reply }]);
      if (data.handoff) setShowHandoff(true);
    } catch {
      setTurns([...next, { role: "assistant", content: chat.replies.error }]);
      setShowHandoff(true);
    } finally {
      setPending(false);
    }
  }

  function handOff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const handoff: ChatHandoff = {
      name: String(data.get("chat-name") ?? "").trim(),
      business: String(data.get("chat-business") ?? "").trim(),
      phone: String(data.get("chat-phone") ?? "").trim(),
      questions: turns.filter((t) => t.role === "user").map((t) => t.content),
    };
    try {
      sessionStorage.setItem(CHAT_HANDOFF_KEY, JSON.stringify(handoff));
    } catch {
      // Storage blocked: the form still opens, just empty.
    }
    setOpen(false);
    // The form reads the handoff when it mounts. Already on /contact, it is
    // mounted, so reload to let it read; anywhere else, navigate.
    if (window.location.pathname === "/contact") window.location.reload();
    else router.push("/contact");
  }

  if (!open) {
    return (
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`${primaryButton} fixed right-4 bottom-4 z-50 gap-2 shadow-lg`}
        aria-haspopup="dialog"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16v10H9l-5 4V5Zm4 4h8m-8 3h5" />
        </svg>
        {chat.openLabel}
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-heading"
      className="fixed inset-x-4 bottom-4 z-50 flex max-h-[min(36rem,calc(100dvh-2rem))] flex-col rounded-card border border-line bg-surface shadow-2xl sm:left-auto sm:w-96"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div>
          <h2 id="chat-heading" className="text-label font-semibold text-ink">
            {chat.heading}
          </h2>
          <p className="mt-1 text-label text-ink-subtle">{chat.intro}</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={chat.closeLabel}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-field text-ink-muted hover:text-ink"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div ref={logRef} className="flex-1 overflow-y-auto p-4" aria-live="polite">
        <ul className="flex flex-col gap-3">
          <li className="max-w-[85%] rounded-field bg-surface-raised px-3 py-2 text-label text-ink">{chat.greeting}</li>
          {turns.map((t, i) => (
            <li
              key={i}
              className={
                t.role === "user"
                  ? "max-w-[85%] self-end rounded-field bg-signal-wash px-3 py-2 text-label text-ink"
                  : "max-w-[85%] rounded-field bg-surface-raised px-3 py-2 text-label whitespace-pre-line text-ink"
              }
            >
              {t.content}
            </li>
          ))}
          {pending && <li className="text-label text-ink-subtle">{chat.sendingLabel}</li>}
        </ul>

        {turns.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {chat.suggestions.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className={`${secondaryButton} text-left`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {showHandoff && (
          <form onSubmit={handOff} className="mt-4 flex flex-col gap-3 rounded-card border border-line p-3" aria-labelledby="chat-handoff-heading">
            <h3 id="chat-handoff-heading" className="text-label font-semibold text-ink">
              {chat.handoffHeading}
            </h3>
            <p className="text-label text-ink-subtle">{chat.handoffIntro}</p>
            <label className="text-label text-ink" htmlFor="chat-name">
              {chat.nameLabel}
            </label>
            <input id="chat-name" name="chat-name" required autoComplete="name" className={fieldClass} />
            <label className="text-label text-ink" htmlFor="chat-business">
              {chat.businessLabel}
            </label>
            <input id="chat-business" name="chat-business" autoComplete="organization" className={fieldClass} />
            <label className="text-label text-ink" htmlFor="chat-phone">
              {chat.phoneLabel}
            </label>
            <input id="chat-phone" name="chat-phone" type="tel" required autoComplete="tel" className={fieldClass} />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primaryButton}>
                {chat.handoffSubmit}
              </button>
              <button type="button" onClick={() => setShowHandoff(false)} className={secondaryButton}>
                {chat.handoffCancel}
              </button>
            </div>
          </form>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="flex flex-col gap-2 border-t border-line p-3"
      >
        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">
            {chat.inputLabel}
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_CHARS}
            placeholder={chat.inputPlaceholder}
            autoComplete="off"
            className={fieldClass}
          />
          <button type="submit" disabled={pending || !draft.trim()} className={primaryButton}>
            {chat.sendLabel}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-eyebrow text-ink-subtle">{chat.disclaimer}</p>
          {!showHandoff && (
            <button type="button" onClick={() => setShowHandoff(true)} className="min-h-11 text-label text-signal underline underline-offset-4">
              {chat.handoffButton}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
