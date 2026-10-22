import { FIRST_PROVIDER, type Provider } from "./example-providers.ts";
import { type ExampleFile, exampleCode, exampleFile, exampleProviders } from "./example-sources.ts";
import { FIRST_VERSION, type VersionKind } from "./example-versions.ts";
import { liveHost } from "./live-host.ts";
import { livePage } from "./live-page.ts";
import { PROVIDER_MARKUP, type ProviderMarkup } from "./provider-markup.ts";
import type { SiteMapSettings } from "./site-map-settings.ts";

/** A version of an example on one provider, as its frame runs it. */
export interface LiveVersionMarkup {
  readonly kind: VersionKind;
  readonly provider: Provider;
  /** Its HTML as the site runs it: the page's, or the host's its module mounts on. */
  readonly markup: string;
}

/**
 * The versions the frame of the example `name` runs, with the site's settings: on each provider
 * it runs on, in the order offered, the page, then the vanilla and React versions.
 */
export function liveVersions(name: string, settings: SiteMapSettings): LiveVersionMarkup[] {
  return exampleProviders(name).flatMap((provider) => {
    const rewrite = PROVIDER_MARKUP[provider](settings);
    return exampleCode(name, provider).map(({ kind, folder, files }) => {
      const html = htmlOf(files, `examples/${folder}'s ${kind} version`);
      return { kind, provider, markup: liveMarkup(kind, html, rewrite) };
    });
  });
}

/** Whether the frame shows `version` before the visitor chooses one. */
export function shownFirst({ kind, provider }: Omit<LiveVersionMarkup, "markup">): boolean {
  return kind === FIRST_VERSION && provider === FIRST_PROVIDER;
}

/**
 * Whether the example's page calls `save(location)`, which the site writes: its frame has a note
 * saying what was saved.
 */
export function callsSave(name: string): boolean {
  return exampleFile(name, "page.html").includes("save(");
}

function liveMarkup(kind: VersionKind, html: string, rewrite: ProviderMarkup): string {
  return kind === "html" ? livePage(html, rewrite.holdMap) : liveHost(rewrite.prepareHost(html));
}

function htmlOf(files: readonly ExampleFile[], version: string): string {
  const html = files.find(({ lang }) => lang === "html");
  if (html === undefined) throw new Error(`${version} has no HTML file`);
  return html.code;
}
