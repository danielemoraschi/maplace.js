import type { ExampleFile } from "./example-sources.ts";
import { VERSION_MODULES } from "./example-versions.ts";
import { requireOnce } from "./page-markup.ts";

/** A host's text split at Google's bootstrap loader, so the site can show the loader folded. */
export interface HostParts {
  readonly before: string;
  /** The loader's `<script>`, with the line break after it. */
  readonly loader: string;
  readonly after: string;
}

/** The HTML a live version mounts on: the files that load Maps JS with Google's loader. */
const HOST_FILES: ReadonlySet<string> = new Set(
  Object.keys(VERSION_MODULES).map((version) => `${version}.html`),
);

/**
 * Google's loader: an inline `<script>` whose body calls `importLibrary`, never reaching past its
 * own `</script>` into another script.
 */
const BOOTSTRAP_SCRIPT =
  /<script>(?:(?!<\/script>)[\s\S])*importLibrary(?:(?!<\/script>)[\s\S])*<\/script>\n?/g;

/**
 * `file` of the example `example` split at its bootstrap loader, the parts joined being the file
 * as written; `undefined` for a file that isn't a host (a page, a module). A host must have the
 * loader once.
 */
export function foldBootstrap(example: string, file: ExampleFile): HostParts | undefined {
  if (!HOST_FILES.has(file.file)) return undefined;
  const loader = requireOnce(
    file.code,
    BOOTSTRAP_SCRIPT,
    `examples/${example}/${file.file} has Google's bootstrap loader once`,
  );
  const start = file.code.indexOf(loader);
  return {
    before: file.code.slice(0, start),
    loader,
    after: file.code.slice(start + loader.length),
  };
}
