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
 *   5  2-up then 3-up; last spans the     2 + last, 3 + last
 *      gap in both.
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
  5: {
    columns: "sm:grid-cols-2 lg:grid-cols-3",
    lastItem: "sm:col-span-2 lg:col-span-1",
  },
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
 * A 2-up/3-up fallback for lists longer than the table covers.
 *
 * It can orphan the last item at one breakpoint or another, which is why the
 * table above exists at all — but at ten-plus items a single short last row
 * reads as a long list rather than as a mistake, and guessing at a shape for
 * every possible length would be worse than saying so here.
 */
const FALLBACK: GridShape = {
  columns: "sm:grid-cols-2 lg:grid-cols-3",
  lastItem: "",
};

export function gridShape(count: number): GridShape {
  return SHAPES[count] ?? FALLBACK;
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
