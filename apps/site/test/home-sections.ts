import type { MaplaceMapElement } from "maplace/element";
import type { Locator, Page } from "playwright";
import type { Provider } from "../src/examples/example-providers.ts";
import { findGroupOfSection, groupPath } from "../src/examples/example-sections.ts";
import { VERSION_LABELS, type VersionKind } from "../src/examples/example-versions.ts";
import { SHOWN_NOTES } from "../src/scripts/version-notes.ts";
import type { SiteSession } from "./site-session.ts";
import type { Visitor } from "./visitor.ts";

/** A version as the section's switch offers it. */
export type VersionChoice = (typeof VERSION_LABELS)[number];

/** The switch's choice for a version of `kind`. */
export function versionChoice(kind: VersionKind): VersionChoice {
  const choice = VERSION_LABELS.find((label) => label.kind === kind);
  if (choice === undefined) throw new Error(`no version of kind ${kind}`);
  return choice;
}

/**
 * The versions in the order a section's test opens them, the section at `index` starting one
 * further along than the one before: each version takes its turn at readying the page's provider.
 */
export function versionsInTurn(index: number): [VersionChoice, ...VersionChoice[]] {
  const turn = index % VERSION_LABELS.length;
  const order = [...VERSION_LABELS.slice(turn), ...VERSION_LABELS.slice(0, turn)];
  return order as [VersionChoice, ...VersionChoice[]];
}

/** The route of the examples' page holding `name`'s section (W38). */
export function sectionPage(name: string): string {
  const group = findGroupOfSection(name);
  if (group === undefined) throw new Error(`no example group holds ${name}`);
  return groupPath(group);
}

/**
 * A fresh visitor on the examples' page of `site` holding `name`'s section, with only that section
 * left, scrolled to it.
 */
export async function visitSection(
  site: SiteSession,
  name: string,
): Promise<Visitor & { readonly section: Locator }> {
  const visit = await site.visitor();
  await visit.page.goto(new URL(`${sectionPage(name)}#${name}`, site.url).href);
  await leaveOnlySection(visit.page, name);
  return { ...visit, section: await sectionOf(visit.page, name) };
}

/** The notes of the version `section` shows: each version has its own (`version-notes.ts`). */
export const shownNotes = (section: Locator) => section.locator(SHOWN_NOTES);

/** Runs `example`'s section's map from `version` (its label): the switch above its frame. */
export function chooseVersion(page: Page, example: string, version: string): Promise<void> {
  return checkRadio(page, example, version);
}

/** Runs every example on `provider` (its label): the page's one toggle. */
export function chooseProvider(page: Page, provider: string): Promise<void> {
  return providerToggle(page).getByRole("radio", { name: provider, exact: true }).check();
}

/** The page's toggle choosing the examples' provider. */
export const providerToggle = (page: Page) =>
  page.getByRole("group", { name: "Run the examples on" });

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

/** Chooses `example`'s tab `name` (Map, HTML, Script, Bundler, React), and gives back its section. */
export async function chooseTab(page: Page, example: string, name: string): Promise<Locator> {
  const section = await sectionOf(page, example);
  await section.getByRole("tab", { name }).click();
  return section;
}

/** `example`'s section on its examples' page, scrolled into view. */
export async function sectionOf(page: Page, example: string): Promise<Locator> {
  const section = page.locator(`section#${example}`);
  await section.scrollIntoViewIfNeeded();
  return section;
}

/** The examples' bar's nav of group links (`ExampleGroupBar.astro`). */
export const groupNav = (page: Page) => page.getByRole("navigation", { name: "Examples" });

/** The examples' bar's link to the group labelled `label`. */
export const groupLink = (page: Page, label: string) =>
  groupNav(page).getByRole("link", { name: new RegExp(`^${label} `) });
