import type { Loader } from "astro/loaders";
import { type Pin, withPinnedScripts } from "../../../../scripts/build/cdn-pins.ts";
import { readRootFile } from "../../../../scripts/build/package.ts";
import { cdnPin } from "./cdn-pin.ts";
import { withLinksFromRoot } from "./doc-relative-links.ts";
import { GUIDE_ROUTES } from "./guide-routes.ts";
import { DOC_ROUTES, REPO_DOCS, type RepoDoc } from "./repo-docs.ts";
import { siteBlobBase } from "./site-blob-base.ts";
import { withSiteLinks } from "./site-links.ts";

/** The content loader of the `docs` collection: each repo document, rendered. */
export function repoDocsLoader(): Loader {
  return {
    name: "repo-docs",
    async load({ store, renderMarkdown }) {
      const pin = await cdnPin();
      const blobBase = siteBlobBase();
      store.clear();
      for (const doc of REPO_DOCS) {
        const rendered = await renderMarkdown(repoDocMarkdown(doc, { pin, blobBase }));
        store.set({
          id: doc.id,
          data: { title: doc.title, description: doc.description },
          rendered,
        });
      }
    },
  };
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
  return siteMarkdownOf(pinned, doc.file, blobBase);
}

/**
 * `markdown`, the repo file at `file`, as a page of the site shows it: without its title, which
 * the page writes, its links to repo documents going to their pages, to examples' guides to their
 * sections, the rest to GitHub.
 */
export function siteMarkdownOf(markdown: string, file: string, blobBase: string): string {
  const fromRoot = withLinksFromRoot(withoutTitle(markdown), file);
  return withSiteLinks(fromRoot, { routes: SITE_ROUTES, blobBase });
}

const SITE_ROUTES = { ...DOC_ROUTES, ...GUIDE_ROUTES };

/** `markdown` without its leading `# title`, which the page writes. */
export function withoutTitle(markdown: string): string {
  return markdown.replace(/^# [^\n]*\n+/, "");
}
