import type { StylesheetPlace } from "../../../../packages/maplace/src/testing/examples/linked-stylesheets.ts";
import { type ExampleData, exampleData } from "./example-data.ts";
import { type Provider, providerLabel } from "./example-providers.ts";

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
  /** The provider whose versions alone use it, when the example runs on others too. */
  readonly onlyOn?: string;
}

/** An example's code on one provider, as the files it fetches are read from it. */
interface ProviderCode {
  readonly provider: Provider;
  readonly files: readonly { readonly code: string }[];
}

/**
 * The data files an example's code fetches, each linked to the site's copy, naming the provider
 * whose versions alone fetch it when the example runs on more than one.
 */
export function fetchedDataLinks(codes: readonly ProviderCode[]): ExampleFileLink[] {
  const providers = [...new Set(codes.map(({ provider }) => provider))];
  const fetchedOn = providers.map((provider) => {
    const own = codes.filter((code) => code.provider === provider);
    return { provider, names: new Set(dataFetchedBy(sourcesOf(own)).map(({ name }) => name)) };
  });
  return dataFetchedBy(sourcesOf(codes)).map(({ name }) => {
    const [only, ...others] = fetchedOn.filter(({ names }) => names.has(name));
    const alone = providers.length > 1 && only !== undefined && others.length === 0;
    return alone ? { ...dataLink(name), onlyOn: providerLabel(only.provider) } : dataLink(name);
  });
}

/** The sources of `codes`, every file's. */
function sourcesOf(codes: readonly ProviderCode[]): string[] {
  return codes.flatMap(({ files }) => files.map(({ code }) => code));
}

/** The data files `code`, an example's sources, fetches: a template part matches any name part. */
export function dataFetchedBy(code: readonly string[]): ExampleData[] {
  const fetched = code.flatMap((source) =>
    [...source.matchAll(FETCHED_JSON)].map(([, path = ""]) => namePattern(path)),
  );
  return exampleData().filter(({ name }) => fetched.some((pattern) => pattern.test(name)));
}

/** A data file linked to the site's copy, where the examples fetch it. */
function dataLink(name: string): ExampleFileLink {
  const file = `${name}.json`;
  return { file, url: exampleFileHref(`data/${file}`) };
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
