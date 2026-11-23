import type { MaplaceMapElement } from "@maplacejs/maplace/element";
import type { Locator, Page } from "playwright";
import type { Provider } from "../src/examples/example-providers.ts";
import { findExamplePage } from "../src/examples/example-sections.ts";
import { VERSION_LABELS, type VersionKind } from "../src/examples/example-versions.ts";
import { SHOWN_NOTES } from "../src/scripts/version-notes.ts";
import type { SiteSession } from "./site-session.ts";
import type { Visitor } from "./visitor.ts";

/** A version as the section's tabs offer it. */
export type VersionChoice = (typeof VERSION_LABELS)[number];

/** The tab for a version of `kind`. */
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

/** The route of `name`'s example's page (D31). */
export function sectionPage(name: string): string {
  const entry = findExamplePage(name);
  if (entry === undefined) throw new Error(`no example is named ${name}`);
  return entry.path;
}

/**
 * A fresh visitor on `name`'s example's page of `site`, scrolled to its section; `addressTail` is
 * what follows the page's path, a query or an anchor.
 */
export async function visitSection(
  site: SiteSession,
  name: string,
  addressTail = "",
): Promise<Visitor & { readonly section: Locator }> {
  const visit = await site.visitor();
  await visit.page.goto(new URL(`${sectionPage(name)}${addressTail}`, site.url).href);
  return { ...visit, section: await sectionOf(visit.page, name) };
}

/** The notes of the version `section` shows: each version has its own (`version-notes.ts`). */
export const shownNotes = (section: Locator) => section.locator(SHOWN_NOTES);

/** Runs `example`'s section's map from a version, by its label: its tab, which shows its code too. */
export const chooseVersion = (page: Page, example: string, version: string) =>
  chooseTab(page, example, version);

/** Runs the page's example on `provider` (its label), through its toggle. */
export function chooseProvider(page: Page, provider: string, legend?: string): Promise<void> {
  return providerToggle(page, legend).getByRole("radio", { name: provider, exact: true }).check();
}

/** The provider toggles under `scope`, a page or a section, by their legend (`ProviderSwitch.astro`). */
export const providerTogglesIn = (scope: Page | Locator, legend = "Run the examples on") =>
  scope.getByRole("group", { name: legend });

/** The page's shown provider toggle. */
export const providerToggle = (page: Page, legend?: string) =>
  providerTogglesIn(page, legend).filter({ visible: true }).first();

/** What marks `kind`'s version on `provider` of an example on its page, as a CSS selector. */
export const versionSelector = (provider: Provider, kind: VersionKind) =>
  `[data-live-version="${kind}"][data-provider="${provider}"]`;

/** `kind`'s version on `provider` of the example in `section`. */
export function providerVersionIn(
  section: Locator,
  provider: Provider,
  kind: VersionKind,
): Locator {
  return section.locator(versionSelector(provider, kind));
}

/** The `loadState` of the page map in `version`, which says when its map is ready. */
export function pageMapState(version: Locator): Promise<string | undefined> {
  return version.locator("maplace-map").evaluate((map) => (map as MaplaceMapElement).loadState);
}

/** Chooses `example`'s tab `name` (HTML, Script, Bundler, React), and gives back its section. */
export async function chooseTab(page: Page, example: string, name: string): Promise<Locator> {
  const section = await sectionOf(page, example);
  await section.getByRole("tab", { name, exact: true }).click();
  return section;
}

/** `example`'s section on its page, scrolled into view. */
export async function sectionOf(page: Page, example: string): Promise<Locator> {
  const section = page.locator(`section#${example}`);
  await section.scrollIntoViewIfNeeded();
  return section;
}

/** An examples page's menu of every category and example (`PageColumns.astro`). */
export const examplesNav = (page: Page) => page.getByRole("navigation", { name: "Examples" });
