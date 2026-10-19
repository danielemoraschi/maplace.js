import { type ExampleCode, type ExampleFile, exampleCode, exampleFile } from "./example-sources.ts";
import { liveHost } from "./live-host.ts";
import { livePage } from "./live-page.ts";

/** A version of an example as its frame runs it. */
export interface LiveVersionMarkup {
  readonly kind: ExampleCode["kind"];
  /** Its HTML as the site runs it: the page's, or the host's its module mounts on. */
  readonly markup: string;
}

/** The versions the frame of the example `name` runs, the page first, with the site's key. */
export function liveVersions(name: string, apiKey: string | undefined): LiveVersionMarkup[] {
  return exampleCode(name).map(({ kind, files }) => {
    const live = kind === "html" ? livePage : liveHost;
    return { kind, markup: live(htmlOf(files, `examples/${name}'s ${kind} version`), apiKey) };
  });
}

/**
 * Whether the example's page calls `save(location)`, which the site writes: its frame has a note
 * saying what was saved.
 */
export function callsSave(name: string): boolean {
  return exampleFile(name, "page.html").includes("save(");
}

function htmlOf(files: readonly ExampleFile[], version: string): string {
  const html = files.find(({ lang }) => lang === "html");
  if (html === undefined) throw new Error(`${version} has no HTML file`);
  return html.code;
}
