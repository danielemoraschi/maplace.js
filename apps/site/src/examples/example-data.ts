/** A data file the example pages fetch, as the site serves it: `/<name>.json`. */
export interface ExampleData {
  readonly name: string;
  readonly json: unknown;
}

// The files beside the example pages (W4), read at build time: a bundled page can't read the repo
// by path, a glob can.
const DATA = import.meta.glob("../../../../packages/maplace/examples/data/*.json", {
  import: "default",
  eager: true,
});

/** Each of `packages/maplace/examples/data/*.json`, by its name without `.json`. */
export function exampleData(): readonly ExampleData[] {
  return Object.entries(DATA).map(([path, json]) => ({
    name: fileNameOf(path, ".json"),
    json,
  }));
}

/** An icon the example pages show, as the site serves it: `/icons/<name>.svg`. */
export interface ExampleIcon {
  readonly name: string;
  readonly svg: string;
}

const ICONS = import.meta.glob<string>("../../../../packages/maplace/examples/data/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Each of `packages/maplace/examples/data/icons/*.svg`, by its name without `.svg`. */
export function exampleIcons(): readonly ExampleIcon[] {
  return Object.entries(ICONS).map(([path, svg]) => ({
    name: fileNameOf(path, ".svg"),
    svg,
  }));
}

/** `…/data/mixed-a.json` → `mixed-a`. */
function fileNameOf(path: string, extension: string): string {
  return path.slice(path.lastIndexOf("/") + 1, -extension.length);
}
