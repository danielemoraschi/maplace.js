import type { Loader } from "astro/loaders";
import { type Pin, withPinnedScripts } from "../../../../scripts/build/cdn-pins.ts";
import { gitIn } from "../../../../scripts/build/git.ts";
import { packageManifest, ROOT, readRootFile } from "../../../../scripts/build/package.ts";
import { blobBaseFor } from "../../../../scripts/release/repository.ts";
import { cdnPin } from "./cdn-pin.ts";
import { withSiteLinks } from "./site-links.ts";

/** A repo document the site renders as a page of its own. */
export interface RepoDoc {
  /** The page's path segment, and the entry's id. */
  readonly id: string;
  /** Its path in the repo. */
  readonly file: string;
  readonly title: string;
  /** Its name in the site's navigation. */
  readonly label: string;
  /** It has the README's pinned CDN scripts, filled in as staging fills them. */
  readonly pinsScripts: boolean;
}

/**
 * The repository's page on GitHub: the manifest's `repository`, written out because the header
 * and footer render in a bundled page, where the manifest can't be read (repo-docs.test.ts
 * holds the two together).
 */
export const REPOSITORY_URL = "https://github.com/danielemoraschi/maplace.js";

export const REPO_DOCS: readonly RepoDoc[] = [
  {
    id: "getting-started",
    file: "README.md",
    title: "Getting started",
    label: "Getting started",
    pinsScripts: true,
  },
  {
    id: "migrating",
    file: "MIGRATION.md",
    title: "Migrating from 0.2",
    label: "Migrating",
    pinsScripts: false,
  },
];

/** The site's page for the repo document `id`. */
export function docRoute(id: string): string {
  return `/${id}/`;
}

const ROUTES = Object.fromEntries(REPO_DOCS.map(({ file, id }) => [file, docRoute(id)]));

/** The content loader of the `docs` collection: each repo document, rendered. */
export function repoDocsLoader(): Loader {
  return {
    name: "repo-docs",
    async load({ store, renderMarkdown }) {
      const pin = await cdnPin();
      const blobBase = blobBaseFor(packageManifest(), builtCommit());
      store.clear();
      for (const doc of REPO_DOCS) {
        const rendered = await renderMarkdown(repoDocMarkdown(doc, { pin, blobBase }));
        store.set({ id: doc.id, data: { title: doc.title }, rendered });
      }
    },
  };
}

/** The commit the site is built from: its links to the repo's files read them as it saw them. */
function builtCommit(): string {
  return gitIn(ROOT, ["rev-parse", "HEAD"]).trim();
}

export interface RepoDocSettings {
  readonly pin: Pin;
  /** Where the repo's other files are read. */
  readonly blobBase: string;
}

/** `doc`'s Markdown as the site shows it: titled by the page, pinned, its links working. */
export function repoDocMarkdown(doc: RepoDoc, { pin, blobBase }: RepoDocSettings): string {
  const markdown = readRootFile(doc.file);
  const pinned = doc.pinsScripts ? withPinnedScripts(markdown, pin) : markdown;
  return withSiteLinks(withoutTitle(pinned), { routes: ROUTES, blobBase });
}

/** `markdown` without its leading `# title`, which the page writes. */
export function withoutTitle(markdown: string): string {
  return markdown.replace(/^# [^\n]*\n+/, "");
}
