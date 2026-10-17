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

/** An example React component's module, loaded on demand: it exports the component alone. */
export interface ExampleComponent {
  readonly name: string;
  readonly source: string;
  readonly load: () => Promise<Readonly<Record<string, unknown>>>;
}

// Found by glob, so an example runs by being in `examples/`. `migrate/from-0.2.ts` declares its
// inputs instead of having them: it is type-checked only.
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
const COMPONENT_SOURCES = import.meta.glob<string>("../../../examples/*/react.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
});
const COMPONENTS = import.meta.glob<Readonly<Record<string, unknown>>>(
  "../../../examples/*/react.tsx",
);

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

export const EXAMPLE_COMPONENTS: readonly ExampleComponent[] = Object.entries(
  COMPONENT_SOURCES,
).map(([path, source]) => ({
  name: exampleName(path),
  source,
  load: COMPONENTS[path] as ExampleComponent["load"],
}));

/** `simple` from `../../../examples/simple/page.html`. */
function exampleName(path: string): string {
  return path.split("/").at(-2) ?? path;
}
