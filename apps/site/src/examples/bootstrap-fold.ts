import type { ExampleCode, ExampleFile } from "./example-sources.ts";
import { VERSION_MODULES } from "./example-versions.ts";
import { requireOnce } from "./page-markup.ts";

/** A host's text split at Google's bootstrap loader, so the site can show the loader folded. */
export interface HostParts {
  readonly before: string;
  /** The loader's `<script>`, with the line break after it. */
  readonly loader: string;
  readonly after: string;
}

/** A file as a code tab shows it: a Google host with its loader split out to fold. */
export type ShownFile = ExampleFile & { readonly host?: HostParts | undefined };

/** The HTML a live version mounts on: on Google, the files that load Maps JS with its loader. */
export const HOST_FILES: ReadonlySet<string> = new Set(
  Object.keys(VERSION_MODULES).map((version) => `${version}.html`),
);

/**
 * Google's loader: a host's one inline `<script>`, as the package's example tests hold every host
 * to (`example-hosts.ts`); its module script has a `src`, so it doesn't match.
 */
const BOOTSTRAP_SCRIPT = /<script>[\s\S]*?<\/script>\n?/g;

/**
 * `code`'s files as its tab shows them: Google's hosts with their loader to fold; every MapLibre
 * file whole, since its hosts load no Maps JS.
 */
export function filesAsShown({ provider, folder, files }: ExampleCode): readonly ShownFile[] {
  if (provider !== "google") return files;
  return files.map((file) => ({ ...file, host: foldBootstrap(folder, file) }));
}

/**
 * `file`, in `folder` under `packages/maplace/examples/`, split at its bootstrap loader, the parts
 * joined being the file as written; `undefined` for a file that isn't a host (a page, a module).
 * A Google host must have the loader as its one inline script.
 */
export function foldBootstrap(folder: string, file: ExampleFile): HostParts | undefined {
  if (!HOST_FILES.has(file.file)) return undefined;
  const loader = requireOnce(
    file.code,
    BOOTSTRAP_SCRIPT,
    `examples/${folder}/${file.file} has one inline script, Google's bootstrap loader`,
  );
  const [before = "", after = ""] = file.code.split(loader);
  return { before, loader, after };
}
