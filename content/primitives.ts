/**
 * Content primitives shared by more than one content module.
 *
 * These live here rather than in `services.ts` because `categories.ts` needs
 * them too, and `services.ts` already imports `CategorySlug` from
 * `categories.ts`. Keeping the shared types in a third module means neither of
 * those two has to import the other, so there is no cycle to reason about —
 * even a type-only one, which TypeScript tolerates but which makes the
 * dependency direction between two content files ambiguous to a reader.
 */

/**
 * At least three, checked at compile time.
 *
 * A plain `string[]` would let a service or a category ship with one thin
 * symptom, which is exactly the state this type was introduced to fix. The
 * tuple-with-rest makes "fewer than three" a build error rather than something
 * you notice on the live page.
 */
export type AtLeastThree<T> = readonly [T, T, T, ...T[]];

/**
 * One before/after pair. Short phrases, not scenes — the scenes live in
 * `symptoms`. These read as a two-column comparison, so each side should be a
 * fragment a reader takes in at a glance.
 */
export type BeforeAfter = {
  before: string;
  after: string;
};
