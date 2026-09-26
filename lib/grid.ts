/**
 * Grid shapes that adapt to how many things are in them.
 *
 * A fixed `sm:grid-cols-2 lg:grid-cols-3` is fine until a list has four items,
 * at which point the fourth sits alone on its own row and the section reads as
 * unfinished. The catalogue changes — that has happened four times in this
 * build — so the column count cannot be a constant chosen for whatever the
 * length happened to be that week.
 *
 * The rule: no lone item on the last row, at any breakpoint. Two things make
 * that possible:
 *
 *   - choosing a column count that divides the item count, and
 *   - where nothing divides it, letting the last item span the remainder.
 *
 * Every class is written out in full. Tailwind finds classes by scanning source
 * text and never evaluates it, so `` `grid-cols-${n}` `` produces a class that
 * is never generated and an element that silently falls back to one column.
 * Lookup tables of complete class names are how a variant stays dynamic
 * without disappearing.
 *
 * Below `sm` everything is a single column, which cannot orphan anything —
 * so the shapes only ever need to fix `sm` and up.
 *
 * Two defects, not one. A lone item on the last row is the obvious half; the
 * other is an EMPTY cell on the last row, which since Phase 7b is visible as
 * a gap in a bordered grid rather than hidden by a filled container. Every
 * shape below therefore has to tile its rows exactly, at every breakpoint it
 * declares.
 */

export type GridShape = {
  /** Column utilities for the grid container. */
  columns: string;
  /** Applied to the last child. Empty when nothing needs to stretch. */
  lastItem: string;
};

/*
 * The arithmetic, count by count:
 *
 *   2  2-up.                              2        exact
 *   3  3-up, and one column until then.   3        exact
 *      (2-up would leave 2 + 1.)
 *   4  2x2, 4-up on a wide screen.        2, 4     exact
 *   5  2-up only; last spans the gap.    2 + last
 *      3-up cannot work: 3 + 2 leaves an
 *      empty cell, and a last item wide
 *      enough to fill it pushes the
 *      fourth onto a row of its own.
 *   6  2-up then 3-up.                    2, 3     exact
 *   7  as 5, but the last item goes
 *      full width at lg (3 + 3 + 1).
 *   8  2x4, 4-up on a wide screen.        2, 4     exact
 *   9  2-up then 3-up; 9 divides by 3,
 *      so only sm needs the stretch.
 */
const SHAPES: Record<number, GridShape> = {
  1: { columns: "", lastItem: "" },
  2: { columns: "sm:grid-cols-2", lastItem: "" },
  3: { columns: "lg:grid-cols-3", lastItem: "" },
  4: { columns: "sm:grid-cols-2 xl:grid-cols-4", lastItem: "" },
  5: { columns: "sm:grid-cols-2", lastItem: "sm:col-span-2" },
  6: { columns: "sm:grid-cols-2 lg:grid-cols-3", lastItem: "" },
  7: {
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    lastItem: "sm:col-span-2 lg:col-span-3",
  },
  8: { columns: "sm:grid-cols-2 xl:grid-cols-4", lastItem: "" },
  9: {
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    lastItem: "sm:col-span-2 lg:col-span-1",
  },
};

/**
 * Anything longer than the table covers falls back to two columns.
 *
 * Two columns plus "stretch the last one if the count is odd" is exact for
 * every length, which is the property that matters: the rule is no empty cell
 * and no lone last item, at any width, for any count. A 3-up fallback would
 * read better for a list of eleven and would break that rule at eleven, so it
 * is not the fallback.
 *
 * The table above exists to do better than two columns where the arithmetic
 * allows it, not to be the only safe path.
 */
export function gridShape(count: number): GridShape {
  return (
    SHAPES[count] ?? { columns: "sm:grid-cols-2", lastItem: spanLastIfOdd(count) }
  );
}

/**
 * For a fixed two-column list of text lines: stretch the last item across both
 * columns when the count is odd.
 *
 * Separate from `gridShape` because the shapes above change the column count at
 * breakpoints, and these lists must not — nine one-line deliverables read fine
 * in two columns and badly in three. So the column count is fixed and only the
 * last item moves.
 *
 * Returns nothing for an even count. Spanning the last item there would push it
 * onto a row of its own and leave a gap beside the one above it, which is the
 * same defect from the other direction.
 */
export function spanLastIfOdd(count: number): string {
  return count % 2 === 1 ? "sm:col-span-2" : "";
}
