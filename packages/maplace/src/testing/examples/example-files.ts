/// <reference types="vite/client" />

/** An example page, as a reader copies it. */
export interface ExamplePage {
  readonly name: string;
  readonly html: string;
}

/** A vanilla or React version: the HTML it mounts on, and a way to run its module. */
export interface ExampleHost {
  readonly example: string;
  readonly kind: HostKind;
  readonly html: string;
  /** Imports the module, which runs it: once per document, as a page's module script runs. */
  readonly run: () => Promise<unknown>;
}

/** The versions a host page runs: a module, vanilla or React. */
export const HOST_KINDS = ["vanilla", "react"] as const;
type HostKind = (typeof HOST_KINDS)[number];

/** One example, written three ways: the same map in each. */
export interface Example {
  readonly name: string;
  readonly page: ExamplePage;
  readonly vanilla: ExampleHost;
  readonly react: ExampleHost;
}

/** Examples with a page only: `quick-start` is the docs' first snippet, not a site section. */
const PAGE_ONLY: ReadonlySet<string> = new Set(["quick-start"]);

const MODULE_FILE: Readonly<Record<HostKind, string>> = {
  vanilla: "vanilla.ts",
  react: "react.tsx",
};

// Found by glob, so an example runs by being in `examples/`. `migrate/from-0.2.ts` declares its
// inputs instead of having them: it is type-checked only.
const FILES = import.meta.glob<string>("../../../examples/*/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});
const MODULES = import.meta.glob("../../../examples/*/{vanilla.ts,react.tsx}");

export const EXAMPLE_PAGES: readonly ExamplePage[] = Object.entries(FILES)
  .filter(([path]) => path.endsWith("/page.html"))
  .map(([path, html]) => ({ name: exampleName(path), html }));

/** Every example but the page-only ones, each with all its files: a missing one throws here. */
export const EXAMPLES: readonly Example[] = EXAMPLE_PAGES.filter(
  ({ name }) => !PAGE_ONLY.has(name),
).map((page) => ({
  name: page.name,
  page,
  vanilla: hostOf(page.name, "vanilla"),
  react: hostOf(page.name, "react"),
}));

export const VANILLA_HOSTS: readonly ExampleHost[] = EXAMPLES.map(({ vanilla }) => vanilla);
export const REACT_HOSTS: readonly ExampleHost[] = EXAMPLES.map(({ react }) => react);

function hostOf(example: string, kind: HostKind): ExampleHost {
  const modulePath = pathOf(example, MODULE_FILE[kind]);
  const run = MODULES[modulePath];
  if (run === undefined) throw new Error(`${shown(modulePath)} is missing`);
  return { example, kind, html: fileOf(pathOf(example, `${kind}.html`)), run };
}

function pathOf(example: string, file: string): string {
  return `../../../examples/${example}/${file}`;
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

/** `simple` from `../../../examples/simple/page.html`. */
function exampleName(path: string): string {
  return path.split("/").at(-2) ?? path;
}
