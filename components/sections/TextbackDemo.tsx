import { ButtonLink } from "@/components/ui/ButtonLink";
import { textbackDemo } from "@/content/textbackDemo";
import type { DemoLine } from "@/lib/textbackDemo";

/**
 * "Try it live": a card with a tap-to-call number. A server component and a
 * plain tel: link, so it works with JavaScript off. It sits inside the page's
 * "What changes" section rather than being a section of its own, so the
 * void/surface alternation down the page is the same with or without it.
 */
export function TextbackDemo({ line }: { line: DemoLine }) {
  return (
    <div
      data-reveal=""
      className="mt-12 rounded-card border border-signal/40 bg-void p-7 sm:p-9"
    >
      <p className="text-eyebrow font-mono uppercase text-signal">{textbackDemo.eyebrow}</p>
      <h3 className="mt-4 text-h3 text-ink">{textbackDemo.heading}</h3>
      <p className="mt-4 max-w-prose-tight text-lead text-ink-muted">{textbackDemo.body}</p>

      <div className="mt-8">
        <ButtonLink href={`tel:${line.e164}`}>
          {textbackDemo.callLabel}{" "}
          <span className="font-mono tabular-nums">{line.display}</span>
        </ButtonLink>
      </div>

      <ul className="mt-6 flex flex-col gap-1">
        {textbackDemo.finePrint.map((item) => (
          <li key={item} className="text-label text-ink-subtle">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
