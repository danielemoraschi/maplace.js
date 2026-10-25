import { FIRST_PROVIDER, type Provider } from "./example-providers.ts";
import { type ExampleFile, exampleCode, exampleProviders } from "./example-sources.ts";
import { FIRST_VERSION, type VersionKind } from "./example-versions.ts";
import { liveHost } from "./live-host.ts";
import { livePage } from "./live-page.ts";
import { liveScript } from "./live-script.ts";
import { PROVIDER_MARKUP, type ProviderMarkup } from "./provider-markup.ts";
import type { SiteMapSettings } from "./site-map-settings.ts";

/** A version of an example on one provider, as its frame runs it. */
export interface LiveVersionMarkup {
  readonly kind: VersionKind;
  readonly provider: Provider;
  /** Its HTML as the site runs it: the page's, or the host's its module mounts on. */
  readonly markup: string;
  /**
   * Whether its own files call `save(location)`, which the site writes: its notes say what was
   * saved (`page-save.ts`).
   */
  readonly callsSave: boolean;
}

/**
 * The versions the frame of the example `name` runs, with the site's settings: on each provider
 * it runs on, in the order offered, the page, then the script, vanilla and React versions.
 */
export function liveVersions(name: string, settings: SiteMapSettings): LiveVersionMarkup[] {
  return exampleProviders(name).flatMap((provider) => {
    const rewrite = PROVIDER_MARKUP[provider](settings);
    return exampleCode(name, provider).map(({ kind, folder, files }) => {
      const html = htmlOf(files, `examples/${folder}'s ${kind} version`);
      const callsSave = callsSaveIn(files.map(({ code }) => code));
      return { kind, provider, markup: liveMarkup(kind, html, rewrite), callsSave };
    });
  });
}

/** Whether the frame shows `version` before the visitor chooses one. */
export function shownFirst({
  kind,
  provider,
}: Pick<LiveVersionMarkup, "kind" | "provider">): boolean {
  return kind === FIRST_VERSION && provider === FIRST_PROVIDER;
}

/**
 * A call of the page's own `save(`: not a method's (`store.save(`), a word's (`autosave(`) nor a
 * declaration's (`function save(`).
 */
const SAVE_CALL = /(?<![.\w]|function )save\(/;

/** Whether any of a version's `codes` calls the page's `save(location)`. */
export function callsSaveIn(codes: readonly string[]): boolean {
  return codes.some((code) => SAVE_CALL.test(code));
}

function liveMarkup(kind: VersionKind, html: string, rewrite: ProviderMarkup): string {
  if (kind === "html") return livePage(html, rewrite.holdMap);
  if (kind === "script") return liveScript(html, rewrite.prepareScript);
  return liveHost(rewrite.prepareHost(html));
}

function htmlOf(files: readonly ExampleFile[], version: string): string {
  const html = files.find(({ lang }) => lang === "html");
  if (html === undefined) throw new Error(`${version} has no HTML file`);
  return html.code;
}
