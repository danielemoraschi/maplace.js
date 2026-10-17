import { CHANGELOG_FILE } from "./changelog-lines.ts";

/** The repo's documents: what the doc checks read. */
export const DOCS = [
  "README.md",
  "MIGRATION.md",
  CHANGELOG_FILE,
  "docs/rfc-1.0.md",
  "docs/MODERNIZE.md",
] as const;

/** The end of a Markdown link to a path in the repo: neither a URL (`https:`, `mailto:`), an anchor nor rooted. */
const RELATIVE_LINK = /\]\((?![a-z][a-z\d+.-]*:|[#/])([^)\s]+)\)/gi;

interface RelativeLink {
  /** As written, relative to the document, without its `#anchor`. */
  readonly path: string;
  readonly line: number;
}

/** The relative links and images of `markdown`, outside code fences. */
export function relativeLinksIn(markdown: string): RelativeLink[] {
  return linesOf(markdown)
    .filter(({ isProse }) => isProse)
    .flatMap(({ text, line }) =>
      Array.from(text.matchAll(RELATIVE_LINK), ([, target = ""]) => ({
        path: target.split("#")[0] ?? "",
        line,
      })).filter(({ path }) => path !== ""),
    );
}

/**
 * `markdown` with its links to repo paths made absolute at `blobBase`, outside code fences;
 * images are left as written, since a blob page isn't an image.
 */
export function withAbsoluteLinks(markdown: string, blobBase: string): string {
  return withLinksResolved(markdown, (path) => `${blobBase}${path}`);
}

/**
 * `markdown` with each link to a repo path (as written, anchor included) pointing where
 * `resolve` says, outside code fences; images are left as written.
 */
export function withLinksResolved(markdown: string, resolve: (path: string) => string): string {
  return linesOf(markdown)
    .map(({ text, isProse }) => (isProse ? withLinksResolvedOn(text, resolve) : text))
    .join("\n");
}

/** The code of each fenced block in `markdown` whose fence names `lang`, e.g. `html`. */
export function fencedBlocks(markdown: string, lang: string): string[] {
  const blocks: string[] = [];
  let open: { lang: string; lines: string[] } | undefined;
  for (const line of markdown.split(/\r?\n/)) {
    if (!isFence(line)) {
      open?.lines.push(line);
    } else if (open === undefined) {
      open = { lang: line.slice(3).trim(), lines: [] };
    } else {
      if (open.lang === lang) blocks.push(open.lines.join("\n"));
      open = undefined;
    }
  }
  return blocks;
}

export function isFence(line: string): boolean {
  return line.startsWith("```");
}

interface Line {
  readonly text: string;
  /** Numbered from 1. */
  readonly line: number;
  /** Outside code fences, fences included as code. */
  readonly isProse: boolean;
}

/** The lines of `markdown`, each marked as prose or code. */
function linesOf(markdown: string): Line[] {
  let inFence = false;
  return markdown.split("\n").map((text, index) => {
    const fence = isFence(text);
    if (fence) inFence = !inFence;
    return { text, line: index + 1, isProse: !fence && !inFence };
  });
}

function withLinksResolvedOn(text: string, resolve: (path: string) => string): string {
  return text.replaceAll(RELATIVE_LINK, (link, path: string, offset: number) =>
    isImageAt(text, offset) ? link : `](${resolve(path)})`,
  );
}

/** Whether the link ending at `offset` of `text` opened as an image, `![`. */
function isImageAt(text: string, offset: number): boolean {
  return text[text.lastIndexOf("[", offset) - 1] === "!";
}
