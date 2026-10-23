/// <reference types="vite/client" />
import { type ScriptVersion, scriptOf } from "./example-scripts";

/** The map providers an example is drawn on. */
const PROVIDERS = ["google", "maplibre"] as const;
export type Provider = (typeof PROVIDERS)[number];

/** An example page, as a reader copies it. */
export interface ExamplePage {
  readonly name: string;
  readonly provider: Provider;
  readonly html: string;
}

/** A vanilla or React version: the HTML it mounts on, and a way to run its module. */
export interface ExampleHost {
  readonly example: string;
  readonly provider: Provider;
  readonly kind: HostKind;
  readonly html: string;
  /** The module, as a reader copies it. */
  readonly moduleSource: string;
  /** Imports the module, which runs it: once per document, as a page's module script runs. */
  readonly run: () => Promise<unknown>;
}

/** The versions a host page runs: a module, vanilla or React. */
export const HOST_KINDS = ["vanilla", "react"] as const;
type HostKind = (typeof HOST_KINDS)[number];

/** One example on one provider, written four ways: the same map in each. */
export interface Example {
  readonly name: string;
  readonly provider: Provider;
  readonly page: ExamplePage;
  readonly script: ScriptVersion;
  readonly vanilla: ExampleHost;
  readonly react: ExampleHost;
}

/** Examples with a page only: `quick-start` is the docs' first snippet, not a site section. */
const PAGE_ONLY: ReadonlySet<string> = new Set(["quick-start"]);

/** Whether the example `name` is a page alone, with no vanilla or React version (quick-start). */
export function isPageOnly(name: string): boolean {
  return PAGE_ONLY.has(name);
}

/** Drawn on Google only: MapLibre has no routing. */
const GOOGLE_ONLY: ReadonlySet<string> = new Set(["route"]);

/** Where a provider's versions sit in an example's folder. */
const FOLDER: Readonly<Record<Provider, string>> = { google: "", maplibre: "maplibre/" };

const MODULE_FILE: Readonly<Record<HostKind, string>> = {
  vanilla: "vanilla.ts",
  react: "react.tsx",
};

// Found by glob, so an example runs by being in `examples/`. `migrate/from-0.2.ts` declares its
// inputs instead of having them: it is type-checked only. A MapLibre version sits in `maplibre/`
// beside its Google twin.
const FILES = import.meta.glob<string>(
  ["../../../examples/*/*.html", "../../../examples/*/maplibre/*.html"],
  { query: "?raw", import: "default", eager: true },
);
const MODULES = import.meta.glob([
  "../../../examples/*/{vanilla.ts,react.tsx}",
  "../../../examples/*/maplibre/{vanilla.ts,react.tsx}",
]);
const MODULE_SOURCES = import.meta.glob<string>(
  [
    "../../../examples/*/{vanilla.ts,react.tsx}",
    "../../../examples/*/maplibre/{vanilla.ts,react.tsx}",
  ],
  { query: "?raw", import: "default", eager: true },
);

export const EXAMPLE_PAGES: readonly ExamplePage[] = Object.entries(FILES)
  .filter(([path]) => path.endsWith("/page.html"))
  .map(([path, html]) => ({ name: exampleName(path), provider: providerOf(path), html }));

/** The examples, named by their Google pages: every provider's versions are checked by these. */
const NAMES = EXAMPLE_PAGES.filter(onProvider("google"))
  .map(({ name }) => name)
  .filter((name) => !isPageOnly(name));

/**
 * Every example but the page-only ones, on each provider it is drawn on: a missing file throws
 * here.
 */
export const EXAMPLES: readonly Example[] = PROVIDERS.flatMap((provider) =>
  NAMES.filter((name) => isDrawnOn(name, provider)).map((name) => exampleOf(name, provider)),
);

export const SCRIPT_VERSIONS: readonly ScriptVersion[] = EXAMPLES.map(({ script }) => script);
export const VANILLA_HOSTS: readonly ExampleHost[] = EXAMPLES.map(({ vanilla }) => vanilla);
export const REACT_HOSTS: readonly ExampleHost[] = EXAMPLES.map(({ react }) => react);

/** A filter keeping one provider's pages, hosts or examples. */
export function onProvider(provider: Provider): (item: { readonly provider: Provider }) => boolean {
  return (item) => item.provider === provider;
}

/** The Google example of the same name: the very object in `EXAMPLES`. */
export function googleTwinOf({ name }: Example): Example {
  const twin = EXAMPLES.find((example) => example.name === name && example.provider === "google");
  if (twin === undefined) throw new Error(`${name} has no Google version`);
  return twin;
}

/** Whether the example `name` is drawn on `provider`: all on Google, all but route elsewhere. */
export function isDrawnOn(name: string, provider: Provider): boolean {
  return provider === "google" || !GOOGLE_ONLY.has(name);
}

function exampleOf(name: string, provider: Provider): Example {
  return {
    name,
    provider,
    page: pageOf(name, provider),
    script: scriptOf(name, provider, fileOf(pathOf(name, provider, "script.html"))),
    vanilla: hostOf(name, provider, "vanilla"),
    react: hostOf(name, provider, "react"),
  };
}

/** The entry of `EXAMPLE_PAGES` itself, since the runners find a page's map by its index. */
export function pageOf(name: string, provider: Provider): ExamplePage {
  const page = EXAMPLE_PAGES.find((found) => found.name === name && found.provider === provider);
  if (page === undefined)
    throw new Error(`${shown(pathOf(name, provider, "page.html"))} is missing`);
  return page;
}

function hostOf(example: string, provider: Provider, kind: HostKind): ExampleHost {
  const modulePath = pathOf(example, provider, MODULE_FILE[kind]);
  const run = MODULES[modulePath];
  const moduleSource = MODULE_SOURCES[modulePath];
  if (run === undefined || moduleSource === undefined) {
    throw new Error(`${shown(modulePath)} is missing`);
  }
  const html = fileOf(pathOf(example, provider, `${kind}.html`));
  return { example, provider, kind, html, moduleSource, run };
}

function pathOf(example: string, provider: Provider, file: string): string {
  return `../../../examples/${example}/${FOLDER[provider]}${file}`;
}

function fileOf(path: string): string {
  const file = FILES[path];
  if (file === undefined) throw new Error(`${shown(path)} is missing`);
  return file;
}

/** `examples/simple/page.html`, as a reader finds it. */
function shown(path: string): string {
  return path.replace("../../../", "");
}

/** `simple` from `../../../examples/simple/page.html` or `…/simple/maplibre/page.html`. */
function exampleName(path: string): string {
  return foldersOf(path)[0] ?? path;
}

/** A MapLibre file sits a folder deeper than its Google twin, in `<name>/maplibre/`. */
function providerOf(path: string): Provider {
  return foldersOf(path)[1] === "maplibre" ? "maplibre" : "google";
}

/** The folders under `examples/` a file sits in: `["simple", "maplibre"]`. */
function foldersOf(path: string): string[] {
  return path.split("/examples/")[1]?.split("/").slice(0, -1) ?? [];
}
