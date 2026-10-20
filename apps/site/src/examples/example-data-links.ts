import { type ExampleData, exampleData } from "./example-data.ts";

/**
 * A data file's site path in an example's code, `/points-4k.json`, or one with a template part,
 * `/mixed-${letter}.json`: the name, its parts outside `${…}` kept.
 */
const FETCHED_JSON = /\/((?:[\w-]|\$\{[^}]*\})+)\.json/g;

/** A template part of a fetched path: any name part in its place. */
const TEMPLATE_PART = /\$\{[^}]*\}/;
const ANY_NAME_PART = String.raw`[\w-]+`;

/** A data file of the examples, linked to its place in the repo. */
export interface ExampleDataLink {
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

/** Each of `data` linked to the repo at `blobBase`. */
export function exampleDataLinks(
  data: readonly ExampleData[],
  blobBase: string,
): ExampleDataLink[] {
  return data.map(({ name, path }) => ({ file: `${name}.json`, url: `${blobBase}${path}` }));
}

/** `path`, a fetched name with its template parts, as a pattern for the names it can be. */
function namePattern(path: string): RegExp {
  return new RegExp(`^${path.split(TEMPLATE_PART).join(ANY_NAME_PART)}$`);
}
