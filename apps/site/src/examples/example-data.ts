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
    name: path.slice(path.lastIndexOf("/") + 1, -".json".length),
    json,
  }));
}
