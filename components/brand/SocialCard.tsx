import { ChipMark } from "@/components/brand/ChipMark";
import { site } from "@/content/site";
import { OG_COLOR, OG_GRID_STEP, OG_SIZE } from "@/lib/ogTheme";

/**
 * The social preview card, shared by all four `opengraph-image` routes.
 *
 * ---------------------------------------------------------------------------
 * Rendered by satori, not by a browser. That constrains it in ways worth
 * knowing before editing:
 *
 *   - every element is `display: flex`. Satori has no block layout, and an
 *     element with more than one child and no `display` set throws.
 *   - there is no stylesheet and no cascade, so colours come from lib/ogTheme.ts
 *     as literals and the header on that file explains why.
 *   - `background-repeat` and `background-size` are not reliable, so the circuit
 *     ruling is drawn as real 1px elements on the same 64px step the site uses.
 * ---------------------------------------------------------------------------
 *
 * The card says three things and stops: whose it is, what this page is, and
 * where. No numbers, no claims, nothing that would need sourcing — the same rule
 * the rest of the site follows, applied to the one image people see before they
 * have read anything.
 */
export function SocialCard({
  eyebrow,
  heading,
}: {
  /** The small label above the headline: a category name, or the site name. */
  eyebrow: string;
  /** The page's own headline. */
  heading: string;
}) {
  const columns = Math.ceil(OG_SIZE.width / OG_GRID_STEP);
  const rows = Math.ceil(OG_SIZE.height / OG_GRID_STEP);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        backgroundColor: OG_COLOR.void,
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      {/* The ruling, drawn rather than tiled. Faint enough to be texture. */}
      {Array.from({ length: columns }, (_, i) => (
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: i * OG_GRID_STEP,
            width: 1,
            backgroundColor: OG_COLOR.line,
            opacity: 0.55,
          }}
        />
      ))}
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={`r${i}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: i * OG_GRID_STEP,
            height: 1,
            backgroundColor: OG_COLOR.line,
            opacity: 0.55,
          }}
        />
      ))}

      {/* A wash across the top, so the ruling fades instead of ending. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `linear-gradient(160deg, rgba(69,232,232,0.10) 0%, rgba(6,11,15,0) 45%)`,
        }}
      />

      {/* ------------------------------------------------------- the wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", color: OG_COLOR.signal }}>
          <ChipMark size={44} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: -0.6,
            color: OG_COLOR.ink,
          }}
        >
          {site.name}
        </div>
      </div>

      {/* --------------------------------------------------------- the message */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: OG_COLOR.signal,
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 66,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: -1.8,
            color: OG_COLOR.ink,
            maxWidth: 940,
          }}
        >
          {heading}
        </div>
      </div>

      {/* ----------------------------------------------------------- the foot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${OG_COLOR.line}`,
          paddingTop: 26,
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: OG_COLOR.inkMuted }}>
          {site.serviceArea}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: OG_COLOR.inkSubtle }}>
          {site.domain}
        </div>
      </div>
    </div>
  );
}
