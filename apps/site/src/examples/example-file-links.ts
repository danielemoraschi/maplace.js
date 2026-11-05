import type { StylesheetPlace } from "../../../../packages/maplace/src/testing/examples/linked-stylesheets.ts";
import { type ExampleData, exampleData } from "./example-data.ts";

/**
 * A data file's site path in an example's code, `/examples/data/points-4k.json`, or one with a
 * template part, `/examples/data/live-data-${letter}.json`: the name, its parts outside `${…}` kept.
 */
const FETCHED_JSON = /\/((?:[\w-]|\$\{[^}]*\})+)\.json/g;

/** A template part of a fetched path: any name part in its place. */
const TEMPLATE_PART = /\$\{[^}]*\}/;
const ANY_NAME_PART = String.raw`[\w-]+`;

/** A file of the examples, linked to the site's copy of it. */
export interface ExampleFileLink {
  readonly file: string;
  readonly url: string;
}

/** The data files `code`, an example's sources, fetches: a template part matches any name part. */
export function dataFetchedBy(code: readonly string[]): ExampleData[] {
  const fetched = code.flatMap((source) =>
    [...source.matchAll(FETCHED_JSON)].map(([, path = ""]) => namePattern(path)),
  );
  return exampleData().filter(({ name }) => fetched.some((pattern) => pattern.test(name)));
}

/** Each of `data` linked to the site's copy, where the examples fetch it. */
export function exampleDataLinks(data: readonly ExampleData[]): ExampleFileLink[] {
  return data.map(({ name }) => {
    const file = `${name}.json`;
    return { file, url: exampleFileHref(`data/${file}`) };
  });
}

/** Each of `stylesheets` linked to the site's copy. */
export function stylesheetLinks(stylesheets: readonly StylesheetPlace[]): ExampleFileLink[] {
  return stylesheets.map(({ folder, file }) => ({
    file,
    url: exampleFileHref(`${folder}/${file}`),
  }));
}

/**
 * Where the site serves an example's file, at `path` under `packages/maplace/examples/`: under
 * `/examples/` at the same path, `/examples/data/points-4k.json`, `/examples/styles/whats-on.css`.
 */
export function exampleFileHref(path: string): string {
  return `/examples/${path}`;
}

/** `path`, a fetched name with its template parts, as a pattern for the names it can be. */
function namePattern(path: string): RegExp {
  return new RegExp(`^${path.split(TEMPLATE_PART).join(ANY_NAME_PART)}$`);
}
