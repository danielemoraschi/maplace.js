/// <reference types="vite/client" />

/** An example page, as a reader copies it. */
export interface ExamplePage {
  readonly name: string;
  readonly html: string;
}

/** An example script: its source, and a way to run it once. */
export interface ExampleScript {
  readonly name: string;
  readonly source: string;
  readonly run: () => Promise<unknown>;
}

// Found by glob, so an example runs by being in `examples/`. `migrate/from-0.2.ts` declares its
// inputs instead of having them, and the React drafts are 1.x: both are type-checked only.
const PAGES = import.meta.glob<string>("../../../examples/*/page.html", {
  query: "?raw",
  import: "default",
  eager: true,
});
const SOURCES = import.meta.glob<string>("../../../examples/*/vanilla.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});
const RUNS = import.meta.glob("../../../examples/*/vanilla.ts");

export const EXAMPLE_PAGES: readonly ExamplePage[] = Object.entries(PAGES).map(([path, html]) => ({
  name: exampleName(path),
  html,
}));

export const EXAMPLE_SCRIPTS: readonly ExampleScript[] = Object.entries(SOURCES).map(
  ([path, source]) => ({
    name: exampleName(path),
    source,
    run: RUNS[path] as () => Promise<unknown>,
  }),
);

/** `simple` from `../../../examples/simple/page.html`. */
function exampleName(path: string): string {
  return path.split("/").at(-2) ?? path;
}
