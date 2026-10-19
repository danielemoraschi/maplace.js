import { posix } from "node:path";
import { withLinksResolved } from "../../../../scripts/docs/markdown.ts";

/** `markdown`, the repo document at `file`, with its links relative to it made relative to the repo root. */
export function withLinksFromRoot(markdown: string, file: string): string {
  const docDir = posix.dirname(file);
  return withLinksResolved(markdown, (link) => fromRoot(link, docDir));
}

/** `link`, written in a document of `docDir`, as a path from the repo root, its anchor kept. */
function fromRoot(link: string, docDir: string): string {
  const path = link.split("#")[0] ?? "";
  return `${posix.join(docDir, path)}${link.slice(path.length)}`;
}
