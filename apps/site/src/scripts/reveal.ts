import { fadeIn } from "./fade-in.ts";

/**
 * Shows `element` or hides it: one that appears fades in, as 0.2's panels did; one that leaves,
 * or stays, doesn't move. What the tabs and the version switch do with the panel they choose.
 */
export function reveal(element: HTMLElement, shown: boolean): void {
  const appears = shown && element.hidden;
  element.hidden = !shown;
  if (appears) fadeIn(element);
}
