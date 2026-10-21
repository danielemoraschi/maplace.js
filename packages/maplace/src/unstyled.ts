/**
 * The page's opt-out from maplace's default styles: on any element, it turns them off for that
 * element and everything inside it. The rules maplace's own markup needs stay.
 */
export const UNSTYLED_ATTRIBUTE = "data-maplace-unstyled";

/** Matches an element neither marked nor inside a marked one. */
export const OUTSIDE_UNSTYLED = `:not([${UNSTYLED_ATTRIBUTE}],[${UNSTYLED_ATTRIBUTE}] *)`;

/**
 * `selector` (a list too, as a whole) for a default rule: matching only outside the opt-out, and
 * still weighing nothing, so any rule of the page wins.
 */
/* @__NO_SIDE_EFFECTS__ */
export function outsideUnstyled(selector: string): string {
  return `:where(${selector}):where(${OUTSIDE_UNSTYLED})`;
}
