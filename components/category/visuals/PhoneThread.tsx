"use client";

import { useEffect, useState } from "react";

import { heroVisuals } from "@/content/heroVisuals";
import { useInView } from "@/lib/useInView";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const { header, messages } = heroVisuals.aiAutomation;

/** How long the typing dots show before the message they precede. */
const TYPING_MS = 800;

/** How long a message sits before the next thing happens. */
const DWELL_MS = 1100;

/** The beat at the end, before the thread starts over. */
const RESET_MS = 2800;

/**
 * The whole loop as a list of frames, built once.
 *
 * A frame is "how many messages are showing, are the dots up, and for how
 * long". Precomputing it means the component is a single index advancing on a
 * single timeout, rather than a chain of nested `setTimeout`s that each have to
 * be cleaned up — and it means the loop's total length is something you can
 * read off the data instead of adding up by hand.
 */
type Frame = {
  count: number;
  /**
   * Which side the dots are on, or `null` for no dots.
   *
   * The side matters: dots on the left while the *business* is about to reply
   * would say the customer is typing, which is the opposite of what this
   * picture is about.
   */
  typing: "out" | "in" | null;
  ms: number;
};

const FRAMES: readonly Frame[] = messages.flatMap((message, index) => {
  const frames: Frame[] = [];
  /*
   * No runtime guard against a `system` line asking for dots — the compiler
   * already refuses it. `messages` is `as const`, so narrowing on `typing`
   * leaves only the two conversational sides, and tagging the status line
   * `typing: true` in content/heroVisuals.ts would fail to build rather than
   * quietly put "someone is typing" under a missed-call notice.
   */
  if (message.typing) frames.push({ count: index, typing: message.side, ms: TYPING_MS });
  frames.push({
    count: index + 1,
    typing: null,
    ms: index === messages.length - 1 ? RESET_MS : DWELL_MS,
  });
  return frames;
});

function Bubble({ side, text }: { side: "system" | "out" | "in"; text: string }) {
  if (side === "system") {
    return (
      <p className="message-in text-center font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ink-subtle">
        {text}
      </p>
    );
  }

  const mine = side === "out";

  return (
    <p
      className={`message-in max-w-[80%] rounded-card px-2.5 py-1.5 text-[0.6rem] leading-snug ${
        mine
          ? "self-end bg-signal-wash text-ink"
          : "self-start bg-surface-raised text-ink-muted"
      }`}
    >
      {text}
    </p>
  );
}

/**
 * /ai-automation — the phone thread.
 *
 * A missed call at 8:41pm, answered, qualified and booked without anyone
 * touching it. The thread plays itself out with typing dots between messages,
 * pauses on the booking, and starts again.
 *
 * Each message animates in once, on mount, and the loop unmounts every message
 * when it restarts — which is what replays the entrance without a single
 * `key` trick or a re-triggered class. Opacity and a 6px translate, nothing
 * else.
 *
 * Nothing in here is a real conversation, and the caption on the figure says
 * so. See the header of content/heroVisuals.ts.
 *
 * Under `prefers-reduced-motion: reduce` the whole thread renders at once with
 * no dots and no timer. Offscreen, the timer stops.
 */
export default function PhoneThread() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  const [frame, setFrame] = useState(0);

  const current: Pick<Frame, "count" | "typing"> = prefersReducedMotion
    ? { count: messages.length, typing: null }
    : FRAMES[frame];

  useEffect(() => {
    if (prefersReducedMotion || !inView) return;
    const id = setTimeout(
      () => setFrame((index) => (index + 1) % FRAMES.length),
      FRAMES[frame].ms,
    );
    return () => clearTimeout(id);
  }, [frame, inView, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      /* Stops the typing dots as well as the frame timer. Gating the timer in
         JavaScript was not enough: the dots are a CSS keyframe loop, so the
         last bubble left one running for the rest of the page. Set here rather
         than through `data-pause-offscreen`, because this component mounts
         after MotionRuntime has already collected those — see XrayLens. */
      data-paused={inView ? undefined : ""}
      className="flex h-full w-full items-center justify-center p-3"
    >
      {/* The handset. A rounded frame with a pill for the speaker — enough to
          read as a phone without drawing a specific one. */}
      <div className="flex h-full w-full max-w-[15rem] flex-col overflow-hidden rounded-[1.25rem] border border-line-strong bg-void p-1.5">
        <div className="flex items-center justify-center py-1">
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>

        <div className="flex items-center gap-2 border-b border-line px-2 pb-2">
          <span className="h-4 w-4 rounded-full bg-signal-wash" />
          <span className="text-[0.55rem] font-medium text-ink">{header}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 px-2 pb-2 pt-2">
          {messages.slice(0, current.count).map((message) => (
            <Bubble key={message.text} side={message.side} text={message.text} />
          ))}

          {current.typing !== null && (
            <span
              aria-hidden="true"
              className={`flex w-fit gap-1 rounded-card px-2 py-2 ${
                current.typing === "out"
                  ? "self-end bg-signal-wash"
                  : "self-start bg-surface-raised"
              }`}
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  style={{ "--dot-i": dot } as React.CSSProperties}
                  className="typing-dot h-1 w-1 rounded-full bg-ink-subtle"
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
