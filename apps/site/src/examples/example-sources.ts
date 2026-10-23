import { exampleFolder, PROVIDER_LABELS, type Provider } from "./example-providers.ts";
import { VERSION_LABELS, VERSION_MODULES, type VersionKind } from "./example-versions.ts";

/** One of an example's files, as a reader copies it. */
export interface ExampleFile {
  /** Its name in the example's folder. */
  readonly file: string;
  /** Its language, for highlighting. */
  readonly lang: "html" | "ts" | "tsx";
  readonly code: string;
}

/**
 * One way of using maplacejs an example is written in, on one provider: its code tab, with every
 * file it needs.
 */
export interface ExampleCode {
  readonly kind: VersionKind;
  readonly label: string;
  readonly provider: Provider;
  /** Its folder under `packages/maplace/examples/` (`exampleFolder`). */
  readonly folder: string;
  readonly files: readonly ExampleFile[];
}

const EXAMPLES = "../../../../packages/maplace/examples";

// The files the tests run (T5), read as text: the site shows them and never bundles them this
// way (`example-modules.ts` bundles the version modules). Vite reads each glob as written.
const FILES = import.meta.glob<string>(
  [
    "../../../../packages/maplace/examples/*/*.{html,ts,tsx}",
    "../../../../packages/maplace/examples/*/maplibre/*.{html,ts,tsx}",
  ],
  { query: "?raw", import: "default", eager: true },
);

/** An example's page in its own folder: its MapLibre page (`<name>/maplibre/`) isn't another. */
const TOP_LEVEL_PAGE = /\/examples\/([^/]+)\/page\.html$/;

/** Each version's files: the HTML it runs on first. */
const VERSION_FILES: Readonly<Record<VersionKind, readonly string[]>> = {
  html: ["page.html"],
  script: ["script.html"],
  vanilla: ["vanilla.html", VERSION_MODULES.vanilla],
  react: ["react.html", VERSION_MODULES.react],
};

/** The code of the example `name` on `provider`: page, script, vanilla, React. */
export function exampleCode(name: string, provider: Provider): readonly ExampleCode[] {
  const folder = exampleFolder(name, provider);
  return VERSION_LABELS.map((version) => ({
    ...version,
    provider,
    folder,
    files: VERSION_FILES[version.kind].map((file) => ({
      file,
      lang: langOf(file),
      code: exampleFile(folder, file),
    })),
  }));
}

/** A version's code tab: its code on each provider the example runs on, in the order offered. */
export interface CodeTab {
  readonly kind: VersionKind;
  readonly label: string;
  readonly codes: readonly ExampleCode[];
}

/**
 * The code tabs of the example `name`: page, script, vanilla, React, each on every provider it
 * runs on.
 */
export function codeTabsOf(name: string): readonly CodeTab[] {
  const codes = exampleProviders(name).flatMap((provider) => exampleCode(name, provider));
  return VERSION_LABELS.map(({ kind, label }) => ({
    kind,
    label,
    codes: codes.filter((code) => code.kind === kind),
  }));
}

/** One file in `folder` under `packages/maplace/examples/`, as written. */
export function exampleFile(folder: string, file: string): string {
  const code = FILES[`${EXAMPLES}/${folder}/${file}`];
  if (code === undefined) throw new Error(`examples/${folder}/${file} doesn't exist`);
  return code;
}

/**
 * The providers the example `name` runs on: those it has a page for, in the order offered. An
 * example without a page on any is refused.
 */
export function exampleProviders(name: string): readonly Provider[] {
  const providers = PROVIDER_LABELS.map(({ provider }) => provider).filter(
    (provider) => `${EXAMPLES}/${exampleFolder(name, provider)}/page.html` in FILES,
  );
  if (providers.length === 0) throw new Error(`examples/${name}/page.html doesn't exist`);
  return providers;
}

/** The examples that have a page: their folder names. */
export function exampleNames(): readonly string[] {
  return Object.keys(FILES).flatMap((path) => TOP_LEVEL_PAGE.exec(path)?.[1] ?? []);
}

function langOf(file: string): ExampleFile["lang"] {
  return file.slice(file.lastIndexOf(".") + 1) as ExampleFile["lang"];
}
