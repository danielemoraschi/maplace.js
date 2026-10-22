import type { MaplaceMapElement } from "maplace/element";
import type { Locator, Page } from "playwright";
import type { Provider } from "../src/examples/example-providers.ts";
import { VERSION_LABELS, type VersionKind } from "../src/examples/example-versions.ts";
import type { SiteSession } from "./site-session.ts";
import type { Visitor } from "./visitor.ts";

/** A version as the section's switch offers it. */
export type VersionChoice = (typeof VERSION_LABELS)[number];

/**
 * The versions in the order a section's test opens them, the section at `index` starting one
 * further along than the one before: each version takes its turn at readying the page's provider.
 */
export function versionsInTurn(index: number): [VersionChoice, ...VersionChoice[]] {
  const turn = index % VERSION_LABELS.length;
  const order = [...VERSION_LABELS.slice(turn), ...VERSION_LABELS.slice(0, turn)];
  return order as [VersionChoice, ...VersionChoice[]];
}

/**
 * A fresh visitor on the home page of `site` with only `name`'s section left, scrolled to it.
 */
export async function visitSection(
  site: SiteSession,
  name: string,
): Promise<Visitor & { readonly section: Locator }> {
  const visit = await site.visitor();
  await visit.page.goto(new URL(`/#${name}`, site.url).href);
  await leaveOnlySection(visit.page, name);
  return { ...visit, section: await sectionOf(visit.page, name) };
}

/** Runs `example`'s section's map from `version` (its label): the switch above its frame. */
export function chooseVersion(page: Page, example: string, version: string): Promise<void> {
  return checkRadio(page, example, version);
}

/** Runs `example`'s section's map on `provider` (its label): the switch in its heading row. */
export function chooseProvider(page: Page, example: string, provider: string): Promise<void> {
  return checkRadio(page, example, provider);
}

async function checkRadio(page: Page, example: string, label: string): Promise<void> {
  const section = await sectionOf(page, example);
  await section.getByRole("radio", { name: label, exact: true }).check();
}

/** `kind`'s version on `provider` of the example in `section`. */
export function providerVersionIn(
  section: Locator,
  provider: Provider,
  kind: VersionKind,
): Locator {
  return section.locator(`[data-live-version="${kind}"][data-provider="${provider}"]`);
}

/** The `loadState` of the page map in `version`, which says when its map is ready. */
export function pageMapState(version: Locator): Promise<string | undefined> {
  return version.locator("maplace-map").evaluate((map) => (map as MaplaceMapElement).loadState);
}

/**
 * Takes every other example's section off the page: consent releases each map that comes near
 * the screen, and a neighbour's (about 190px away) would load too, unchecked.
 */
export function leaveOnlySection(page: Page, name: string): Promise<void> {
  return page.evaluate((own) => {
    for (const section of document.querySelectorAll("section:has(.map-frame)")) {
      if (section.id !== own) section.remove();
    }
  }, name);
}

/** Chooses `example`'s tab `name` (Map, HTML, Vanilla, React), and gives back its section. */
export async function chooseTab(page: Page, example: string, name: string): Promise<Locator> {
  const section = await sectionOf(page, example);
  await section.getByRole("tab", { name }).click();
  return section;
}

/** `example`'s section on the home page, scrolled into view. */
export async function sectionOf(page: Page, example: string): Promise<Locator> {
  const section = page.locator(`section#${example}`);
  await section.scrollIntoViewIfNeeded();
  return section;
}
