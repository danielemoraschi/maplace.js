import { page } from "vitest/browser";

/** A phone's screen, narrower than a list beside the map needs. */
const PHONE = { width: 375, height: 800 };

/** A desktop's screen, with room for a list beside the map. */
const DESKTOP = { width: 1280, height: 800 };

/** The screen `showOnPhone` or `showOnDesktop` replaced, to show the page on again. */
let before: { width: number; height: number } | undefined;

/** The page shown on a phone's screen, the screen it had kept to show it on again. */
export function showOnPhone(): Promise<void> {
  return showOn(PHONE);
}

/** The page shown on a desktop's screen, the screen it had kept to show it on again. */
export function showOnDesktop(): Promise<void> {
  return showOn(DESKTOP);
}

function showOn(screen: { width: number; height: number }): Promise<void> {
  before = { width: window.innerWidth, height: window.innerHeight };
  return page.viewport(screen.width, screen.height);
}

/** The page shown again on the screen it had before `showOnPhone` or `showOnDesktop`. */
export function restoreScreen(): Promise<void> {
  if (before === undefined)
    throw new Error("restoreScreen without showOnPhone or showOnDesktop first");
  return page.viewport(before.width, before.height);
}
