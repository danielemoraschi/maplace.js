import { EXAMPLES, extensionOf } from "./example-sources.ts";

/** A data file the example pages fetch, as the site serves it: `/examples/data/<name>.json`. */
export interface ExampleData {
  readonly name: string;
}

/** A file the examples use, as the site serves it: `/examples/<path>`, as written. */
export interface ServedExampleFile {
  /** Its path under `packages/maplace/examples/`: `data/points-4k.json`. */
  readonly path: string;
  /** Text as written, or a photo's bytes. */
  readonly body: string | Uint8Array<ArrayBuffer>;
  readonly contentType: string;
}

// Every file the examples use under `data/` and `styles/` (W4), read at build time: a bundled page
// can't read the repo by path, a glob can. Text as it is; a photo as a data URL (`?inline`, as
// `?raw` would mangle its bytes), decoded below.
const TEXT_FILES = import.meta.glob<string>(
  [
    "../../../../packages/maplace/examples/{data,styles}/**/*",
    "!../../../../packages/maplace/examples/{data,styles}/**/*.webp",
  ],
  { query: "?raw", import: "default", eager: true },
);
const PHOTOS = import.meta.glob<string>(
  "../../../../packages/maplace/examples/{data,styles}/**/*.webp",
  {
    query: "?inline",
    import: "default",
    eager: true,
  },
);

/** The served types, by extension. */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  json: "application/json",
  svg: "image/svg+xml",
  webp: "image/webp",
  css: "text/css; charset=utf-8",
};

/** A data file: in `data/` itself, JSON. */
const DATA_FILE = /^data\/([^/]+)\.json$/;

const SERVED: readonly ServedExampleFile[] = [
  ...Object.entries(TEXT_FILES),
  ...Object.entries(PHOTOS).map(([globPath, dataUrl]) => [globPath, bytesOf(dataUrl)] as const),
]
  .map(([globPath, body]) => {
    const path = globPath.slice(EXAMPLES.length);
    return { path, body, contentType: contentTypeOf(path) };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

/** Every file under the examples' `data/` and `styles/`, by its path there, as written. */
export function servedExampleFiles(): readonly ServedExampleFile[] {
  return SERVED;
}

/** Each data file the example pages fetch, by its name without `.json`. */
export function exampleData(): readonly ExampleData[] {
  return servedExampleFiles().flatMap(({ path }) => {
    const name = DATA_FILE.exec(path)?.[1];
    return name === undefined ? [] : [{ name }];
  });
}

/** `path`'s type by its extension: a file of another kind fails the build, rather than a 404. */
function contentTypeOf(path: string): string {
  const type = CONTENT_TYPES[extensionOf(path)];
  if (type === undefined) throw new Error(`the site serves no file like examples/${path}`);
  return type;
}

/** A `data:` URL's bytes: what follows its base64 comma. */
function bytesOf(dataUrl: string): Uint8Array<ArrayBuffer> {
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}
