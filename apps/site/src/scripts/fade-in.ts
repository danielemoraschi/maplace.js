/** How long a panel fades in: 0.2's `fadeIn('slow')`, jQuery's 600 ms. */
const FADE_MS = 600;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Fades `element` in, as 0.2 showed a tab's panel; the switch that calls it hides the panel it
 * leaves at once. Started by the switches only, never on first render, so no panel fades in as
 * the page loads. Nothing moves for a visitor who asks for less motion.
 */
export function fadeIn(element: HTMLElement): void {
  if (matchMedia(REDUCED_MOTION).matches) return;
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: "ease-out" });
}
