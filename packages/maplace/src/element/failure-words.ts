import { MAP_FAILURE_CLASS, MAP_FAILURE_WORDS } from "../map-failure-words";

/** Words the panel in `pane`, if any, as `failure-label` says; blank, the default. */
export function wordFailurePanel(host: Element, pane: Element): void {
  const words = pane.querySelector(`.${MAP_FAILURE_CLASS}>*`);
  const wanted = host.getAttribute("failure-label")?.trim() || MAP_FAILURE_WORDS;
  // Only when they differ: new text in an alert is announced again.
  if (words && words.textContent !== wanted) words.textContent = wanted;
}
