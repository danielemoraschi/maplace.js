import type { Locator, Page, Route } from "playwright";
import { expect } from "vitest";
import { chooseVersion, pageMapState, type VersionChoice, versionChoice } from "./home-sections.ts";
import { settled } from "./site-session.ts";
import { loadMapsButtons } from "./visitor.ts";

/**
 * What a version's map shows of its view, to compare with another version's: equal for the same
 * locations in the same frame on the same view; `undefined` until the map is drawn.
 */
export type ViewProbe = (version: Locator) => Promise<string | undefined>;

/** How a test reaches a version's map on its provider, reads its view, and how long it may take. */
export interface LeftWhileLoading {
  readonly versionIn: (kind: VersionChoice["kind"]) => Locator;
  readonly viewOf: ViewProbe;
  readonly timeout: number;
}

/** The versions `expectLeftOpensAsShown` compares: one left while it loads, one shown meanwhile. */
export interface LeftAndShown {
  readonly left: VersionChoice;
  readonly shown: VersionChoice;
}

/**
 * W23's cases on styled (four towns, which a fit on a sizeless box or the world's view would
 * spread otherwise): a Bundler version left for the page map, and the page map left for it.
 */
export const LEFT_WHILE_LOADING: readonly (LeftAndShown & { readonly name: string })[] = [
  {
    name: "a Bundler version left while it loaded",
    left: versionChoice("vanilla"),
    shown: versionChoice("html"),
  },
  {
    name: "a page map left while its element loaded",
    left: versionChoice("html"),
    shown: versionChoice("vanilla"),
  },
];

/** The site's scripts asked for since `holdSiteScripts`, held until `release`. */
export interface HeldScripts {
  /** Resolves once one of the site's scripts is held. */
  asked(): Promise<void>;
  /** Lets every held script through, and every later one, as the visitor's route answers it. */
  release(): Promise<void>;
}

/** The site's own scripts: Astro's chunks, the elements', maplibre-gl's and the versions'. */
const SITE_SCRIPTS = "**/_astro/*.js";

/** Holds every script of the site `page` asks for from now on, until `release`. */
export async function holdSiteScripts(page: Page): Promise<HeldScripts> {
  const held: Route[] = [];
  let released = false;
  let heard: () => void = () => {};
  const firstHeld = new Promise<void>((resolve) => {
    heard = resolve;
  });
  await page.route(SITE_SCRIPTS, (route) => {
    if (released) return route.fallback();
    held.push(route);
    heard();
  });
  return {
    asked: () => firstHeld,
    async release() {
      released = true;
      await Promise.all(held.map((route) => route.fallback()));
    },
  };
}

/** The section a test runs W23's case on, its provider chosen. */
export interface OnSection {
  readonly page: Page;
  readonly section: Locator;
  readonly example: string;
}

/**
 * Leaves `left` while it loads for `shown`, then, once `left` was made while hidden, shows it
 * again and expects it on `shown`'s view (the same locations in the same frame: the same view).
 */
export async function expectLeftOpensAsShown(
  on: OnSection,
  { left, shown }: LeftAndShown,
  { versionIn, viewOf, timeout }: LeftWhileLoading,
): Promise<void> {
  const { page, example } = on;
  const leftVersion = versionIn(left.kind);
  await leaveWhileLoading(on, { left, shown }, leftVersion);
  const shownView = await settled(() => viewOf(versionIn(shown.kind)), {
    timeout,
    what: `${example}'s ${shown.label} version's view`,
  });
  await expect
    .poll(() => madeWhileHidden(left, leftVersion), {
      timeout,
      message: `${example}'s ${left.label} version made while hidden`,
    })
    .toBe(true);
  await chooseVersion(page, example, left.label);
  await expect
    .poll(() => viewOf(leftVersion), {
      timeout,
      message: `${example}'s ${left.label} version on ${shown.label}'s view`,
    })
    .toBe(shownView);
}

/**
 * Opens `left`, holds the site's scripts, consents, and switches to `shown` while `left` (whose
 * frame is `leftVersion`) still loads, checked; then lets the scripts through.
 */
async function leaveWhileLoading(
  { page, section, example }: OnSection,
  { left, shown }: LeftAndShown,
  leftVersion: Locator,
): Promise<void> {
  await chooseVersion(page, example, left.label);
  const held = await holdSiteScripts(page);
  await loadMapsButtons(section).click();
  await held.asked();
  expect(await stillLoading(page, left, leftVersion), `${left.label} still loading`).toBe(true);
  await chooseVersion(page, example, shown.label);
  await held.release();
}

/** Whether `version` (`choice`'s) hasn't run yet: its start waits, or its element isn't defined. */
function stillLoading(page: Page, choice: VersionChoice, version: Locator): Promise<boolean> {
  if (choice.kind === "html") {
    return page.evaluate(() => customElements.get("maplace-map") === undefined);
  }
  return version.evaluate((element) => (element as HTMLElement).dataset.starting !== undefined);
}

/** Whether `version` ran while hidden: its page map ready, or its start done. */
function madeWhileHidden(choice: VersionChoice, version: Locator): Promise<boolean> {
  if (choice.kind === "html") return pageMapState(version).then((state) => state === "ready");
  return version.evaluate((element) => (element as HTMLElement).dataset.started !== undefined);
}
