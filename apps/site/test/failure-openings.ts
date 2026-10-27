import type { Page } from "playwright";
import type { Provider } from "../src/examples/example-providers.ts";
import {
  chooseProvider,
  chooseVersion,
  leaveOnlySection,
  sectionOf,
  sectionPage,
} from "./home-sections.ts";
import type { SiteSession } from "./site-session.ts";
import { footerToggle, openHome, type VisitorOptions } from "./visitor.ts";

/** A section opened on its own, a provider and a version chosen, before consenting. */
export interface Opening {
  readonly example: string;
  readonly provider: Provider;
  /** The version's label, chosen before consent: a hidden page map never loads. */
  readonly version: string;
  /** What the test does to the page last before consenting. */
  readonly beforeConsent?: (page: Page) => Promise<unknown>;
}

/** simple on `provider`, its Script version chosen before consent. */
export const simpleFromScript = (provider: Provider): Opening => ({
  example: "simple",
  provider,
  version: "Script",
});

/** A visitor seeing the site as `options` say, on `opening`'s section alone, then consenting. */
export async function sectionFrom(site: SiteSession, options: VisitorOptions, opening: Opening) {
  const { example, provider, version, beforeConsent } = opening;
  const visit = await site.visitor(options);
  const { page } = visit;
  await openHome(page, site.url, sectionPage(example));
  await leaveOnlySection(page, example);
  if (provider === "google") await chooseProvider(page, "Google");
  await chooseVersion(page, example, version);
  await beforeConsent?.(page);
  await footerToggle(page).click();
  return { ...visit, section: await sectionOf(page, example) };
}
