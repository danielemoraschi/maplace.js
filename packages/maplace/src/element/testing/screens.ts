import { page } from "vitest/browser";

/** A phone's screen, narrower than a list beside the map needs. */
const PHONE = { width: 375, height: 800 };

/** The screen `showOnPhone` replaced, to show the page on again. */
let before: { width: number; height: number } | undefined;

/** The page shown on a phone's screen, the screen it had kept to show it on again. */
export function showOnPhone(): Promise<void> {
  before = { width: window.innerWidth, height: window.innerHeight };
  return page.viewport(PHONE.width, PHONE.height);
}

/** The page shown again on the screen it had before `showOnPhone`. */
export function restoreScreen(): Promise<void> {
  if (before === undefined) throw new Error("restoreScreen without showOnPhone first");
  return page.viewport(before.width, before.height);
}
